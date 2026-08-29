"""
Votes routes.

POST /api/votes/cast                   — cast a vote (voter)
GET  /api/votes/receipt/<code>         — verify a receipt code
GET  /api/votes/my/<election_id>       — check if current user has voted
GET  /api/results/<election_id>        — get vote counts per candidate
"""
import json
import hashlib
import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from models import db, Vote, Election, Candidate
from .auth_utils import require_auth, add_audit

votes_bp = Blueprint('votes', __name__)


def make_receipt():
    return 'TFVR-' + secrets.token_hex(3).upper() + '-' + secrets.token_hex(2).upper()


def make_hash(voter_id, election_id, selections):
    raw = f"{voter_id}:{election_id}:{json.dumps(selections, sort_keys=True)}"
    return hashlib.sha256(raw.encode()).hexdigest()[:40]


# ── POST /api/votes/cast ──────────────────────────────────────────────────────
@votes_bp.route('/cast', methods=['POST'])
@require_auth('voter')
def cast_vote():
    data        = request.get_json(force=True) or {}
    election_id = data.get('electionId')
    selections  = data.get('selections')  # {position: candidateId}

    if not election_id or not selections:
        return jsonify({'error': 'electionId and selections are required.'}), 400

    # Election must be ongoing
    election = Election.query.get(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404
    if election.auto_status() != 'ongoing':
        return jsonify({'error': 'This election is not currently accepting votes.'}), 403

    # One vote per voter per election
    existing = Vote.query.filter_by(voter_id=g.user.id, election_id=election_id).first()
    if existing:
        return jsonify({'error': 'You have already voted in this election.',
                        'receiptCode': existing.receipt_code}), 409

    # Validate candidate IDs belong to this election
    for position, cand_id in selections.items():
        cand = Candidate.query.get(cand_id)
        if not cand or cand.election_id != election_id or cand.status != 'active':
            return jsonify({'error': f'Invalid candidate selection for position "{position}".'}), 400

    receipt = make_receipt()
    vote = Vote(
        election_id=election_id,
        voter_id=g.user.id,
        selections=json.dumps(selections),
        receipt_code=receipt,
        timestamp=datetime.utcnow(),
        vote_hash=make_hash(g.user.id, election_id, selections)
    )
    db.session.add(vote)
    db.session.commit()

    add_audit('VOTE_CAST', f'Vote cast in election #{election_id}', g.user.id)
    return jsonify({'receiptCode': receipt, 'message': 'Vote cast successfully!'}), 201


# ── GET /api/votes/receipt/<code> ─────────────────────────────────────────────
@votes_bp.route('/receipt/<code>', methods=['GET'])
@require_auth()
def verify_receipt(code):
    vote = Vote.query.filter_by(receipt_code=code).first()
    if not vote:
        return jsonify({'error': 'Receipt code not found.'}), 404
    return jsonify({
        'valid': True,
        'receiptCode': vote.receipt_code,
        'electionId': vote.election_id,
        'timestamp': vote.timestamp.isoformat() if vote.timestamp else None
    }), 200


# ── GET /api/votes/my/<election_id> ───────────────────────────────────────────
@votes_bp.route('/my/<int:election_id>', methods=['GET'])
@require_auth('voter')
def has_voted(election_id):
    vote = Vote.query.filter_by(voter_id=g.user.id, election_id=election_id).first()
    return jsonify({
        'hasVoted': vote is not None,
        'receiptCode': vote.receipt_code if vote else None
    }), 200


# ── GET /api/votes/results/<election_id> ──────────────────────────────────────
@votes_bp.route('/results/<int:election_id>', methods=['GET'])
def get_results(election_id):
    election = Election.query.get_or_404(election_id)
    candidates = Candidate.query.filter_by(election_id=election_id).all()
    votes = Vote.query.filter_by(election_id=election_id).all()

    # Tally
    counts = {c.id: 0 for c in candidates}
    for vote in votes:
        try:
            selections = json.loads(vote.selections)
        except Exception:
            continue
        for cand_id in selections.values():
            if isinstance(cand_id, int) and cand_id in counts:
                counts[cand_id] += 1

    total_votes = len(votes)
    results = []
    for c in candidates:
        count = counts.get(c.id, 0)
        results.append({
            **c.to_dict(),
            'votes': count,
            'percentage': round((count / total_votes * 100), 1) if total_votes > 0 else 0
        })

    return jsonify({
        'election': election.to_dict(),
        'totalVotes': total_votes,
        'results': results
    }), 200


# ── POST /api/votes/reset/<election_id> ──────────────────────────────────────
@votes_bp.route('/reset/<int:election_id>', methods=['POST'])
@require_auth('admin')
def reset_votes(election_id):
    election = Election.query.get_or_404(election_id)
    deleted = Vote.query.filter_by(election_id=election_id).delete()
    db.session.commit()
    add_audit('VOTES_RESET', f'All {deleted} votes reset for election "{election.title}"', g.user.id)
    return jsonify({'message': f'{deleted} votes deleted for election "{election.title}"'}), 200
