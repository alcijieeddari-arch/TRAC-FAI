"""
Elections routes.

GET    /api/elections              — list all elections (with auto-status)
POST   /api/elections              — create election (admin)
GET    /api/elections/<id>         — get single election
PUT    /api/elections/<id>         — update election (admin)
DELETE /api/elections/<id>         — delete election (admin)
POST   /api/elections/<id>/reset-votes  — wipe votes for election (admin)
"""
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from models import db, Election, Vote
from .auth_utils import require_auth, add_audit

elections_bp = Blueprint('elections', __name__)


def parse_dt(s):
    """Parse ISO 8601 datetime string."""
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except Exception:
        return None


# ── GET /api/elections ────────────────────────────────────────────────────────
@elections_bp.route('', methods=['GET'])
def list_elections():
    elections = Election.query.order_by(Election.start_date.desc()).all()
    return jsonify({'elections': [e.to_dict() for e in elections]}), 200


# ── GET /api/elections/<id> ───────────────────────────────────────────────────
@elections_bp.route('/<int:eid>', methods=['GET'])
def get_election(eid):
    election = Election.query.get_or_404(eid)
    return jsonify({'election': election.to_dict()}), 200


# ── POST /api/elections ───────────────────────────────────────────────────────
@elections_bp.route('', methods=['POST'])
@require_auth('admin')
def create_election():
    data = request.get_json(force=True) or {}

    title       = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    start_date  = parse_dt(data.get('startDate'))
    end_date    = parse_dt(data.get('endDate'))
    positions   = data.get('positions', [])
    total_voters = int(data.get('totalVoters', 0))

    if not title:
        return jsonify({'error': 'Election title is required.'}), 400
    if not start_date or not end_date:
        return jsonify({'error': 'Start and end dates are required.'}), 400
    if end_date <= start_date:
        return jsonify({'error': 'End date must be after start date.'}), 400

    election = Election(
        title=title,
        description=description,
        start_date=start_date,
        end_date=end_date,
        positions=json.dumps(positions),
        total_voters=total_voters,
    )
    db.session.add(election)
    db.session.commit()

    add_audit('ELECTION_CREATED', f'Election "{title}" created', g.user.id)
    return jsonify({'election': election.to_dict()}), 201


# ── PUT /api/elections/<id> ───────────────────────────────────────────────────
@elections_bp.route('/<int:eid>', methods=['PUT'])
@require_auth('admin')
def update_election(eid):
    election = Election.query.get_or_404(eid)
    data = request.get_json(force=True) or {}

    if 'title' in data:       election.title        = data['title'].strip()
    if 'description' in data: election.description  = data['description'].strip()
    if 'startDate' in data:   election.start_date   = parse_dt(data['startDate'])
    if 'endDate' in data:     election.end_date      = parse_dt(data['endDate'])
    if 'positions' in data:   election.positions     = json.dumps(data['positions'])
    if 'totalVoters' in data: election.total_voters  = int(data['totalVoters'])
    if 'status' in data and data['status'] in ('upcoming', 'ongoing', 'closed'):
        election.forced_status = data['status']  # Admin override

    db.session.commit()
    add_audit('ELECTION_UPDATED', f'Election "{election.title}" updated', g.user.id)
    return jsonify({'election': election.to_dict()}), 200


# ── DELETE /api/elections/<id> ────────────────────────────────────────────────
@elections_bp.route('/<int:eid>', methods=['DELETE'])
@require_auth('admin')
def delete_election(eid):
    election = Election.query.get_or_404(eid)
    title = election.title
    db.session.delete(election)
    db.session.commit()
    add_audit('ELECTION_DELETED', f'Election "{title}" deleted', g.user.id)
    return jsonify({'message': f'Election "{title}" deleted.'}), 200


# ── POST /api/elections/<id>/reset-votes ─────────────────────────────────────
@elections_bp.route('/<int:eid>/reset-votes', methods=['POST'])
@require_auth('admin')
def reset_votes(eid):
    election = Election.query.get_or_404(eid)
    deleted = Vote.query.filter_by(election_id=eid).delete()
    db.session.commit()
    add_audit('VOTES_RESET',
              f'All {deleted} votes reset for election "{election.title}"',
              g.user.id)
    return jsonify({'message': f'Reset {deleted} vote(s) for "{election.title}".'}), 200
