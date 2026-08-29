"""
Candidates routes.

GET    /api/candidates             — list all candidates (filter: ?election_id=N)
GET    /api/candidates/<id>        — get single candidate
POST   /api/candidates             — add candidate with optional photo (admin, multipart)
PUT    /api/candidates/<id>        — update candidate (admin)
DELETE /api/candidates/<id>        — delete candidate (admin)
"""
import os
import uuid
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from models import db, Candidate
from .auth_utils import require_auth, add_audit

candidates_bp = Blueprint('candidates', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_photo(file_storage):
    """Save an uploaded photo, return the URL path."""
    if not file_storage or file_storage.filename == '':
        return None
    if not allowed_file(file_storage.filename):
        return None
    ext = file_storage.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    file_storage.save(os.path.join(upload_dir, filename))
    return f"http://localhost:5000/uploads/{filename}"


# ── GET /api/candidates ───────────────────────────────────────────────────────
@candidates_bp.route('', methods=['GET'])
def list_candidates():
    election_id = request.args.get('election_id', type=int)
    q = Candidate.query
    if election_id:
        q = q.filter_by(election_id=election_id)
    candidates = q.order_by(Candidate.position, Candidate.name).all()
    return jsonify({'candidates': [c.to_dict() for c in candidates]}), 200


# ── GET /api/candidates/<id> ──────────────────────────────────────────────────
@candidates_bp.route('/<int:cid>', methods=['GET'])
def get_candidate(cid):
    candidate = Candidate.query.get_or_404(cid)
    return jsonify({'candidate': candidate.to_dict()}), 200


# ── POST /api/candidates ──────────────────────────────────────────────────────
@candidates_bp.route('', methods=['POST'])
@require_auth('admin')
def create_candidate():
    # Support both multipart/form-data (with photo) and JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        form        = request.form
        election_id = form.get('electionId', type=int)
        name        = (form.get('name') or '').strip()
        position    = (form.get('position') or '').strip()
        party       = (form.get('party') or '').strip()
        platform    = (form.get('platform') or '').strip()
        department  = (form.get('department') or '').strip()
        photo_url   = save_photo(request.files.get('photo'))
    else:
        data        = request.get_json(force=True) or {}
        election_id = data.get('electionId') or data.get('election_id')
        name        = (data.get('name') or '').strip()
        position    = (data.get('position') or '').strip()
        party       = (data.get('party') or '').strip()
        platform    = (data.get('platform') or '').strip()
        department  = (data.get('department') or '').strip()
        photo_url   = data.get('photoUrl') or data.get('photo')

    if not election_id or not name or not position:
        return jsonify({'error': 'electionId, name, and position are required.'}), 400

    candidate = Candidate(
        election_id=int(election_id),
        name=name,
        position=position,
        party=party,
        platform=platform,
        department=department,
        photo_url=photo_url,
        status='active'
    )
    db.session.add(candidate)
    db.session.commit()

    add_audit('CANDIDATE_ADDED', f'Candidate "{name}" added for position "{position}"', g.user.id)
    return jsonify({'candidate': candidate.to_dict()}), 201


# ── PUT /api/candidates/<id> ──────────────────────────────────────────────────
@candidates_bp.route('/<int:cid>', methods=['PUT'])
@require_auth('admin')
def update_candidate(cid):
    candidate = Candidate.query.get_or_404(cid)

    if request.content_type and 'multipart/form-data' in request.content_type:
        form = request.form
        if 'name'       in form: candidate.name       = form['name'].strip()
        if 'position'   in form: candidate.position   = form['position'].strip()
        if 'party'      in form: candidate.party      = form['party'].strip()
        if 'platform'   in form: candidate.platform   = form['platform'].strip()
        if 'department' in form: candidate.department = form['department'].strip()
        if 'status'     in form: candidate.status     = form['status']
        new_photo = save_photo(request.files.get('photo'))
        if new_photo:
            candidate.photo_url = new_photo
    else:
        data = request.get_json(force=True) or {}
        if 'name'       in data: candidate.name       = data['name'].strip()
        if 'position'   in data: candidate.position   = data['position'].strip()
        if 'party'      in data: candidate.party      = data['party'].strip()
        if 'platform'   in data: candidate.platform   = data['platform'].strip()
        if 'department' in data: candidate.department = data['department'].strip()
        if 'status'     in data: candidate.status     = data['status']
        if 'photoUrl'   in data and data['photoUrl'] is not None: candidate.photo_url = data['photoUrl']
        elif 'photo'    in data and data['photo'] is not None: candidate.photo_url = data['photo']

    db.session.commit()
    add_audit('CANDIDATE_UPDATED', f'Candidate "{candidate.name}" updated', g.user.id)
    return jsonify({'candidate': candidate.to_dict()}), 200


# ── DELETE /api/candidates/<id> ───────────────────────────────────────────────
@candidates_bp.route('/<int:cid>', methods=['DELETE'])
@require_auth('admin')
def delete_candidate(cid):
    candidate = Candidate.query.get_or_404(cid)
    name = candidate.name
    db.session.delete(candidate)
    db.session.commit()
    add_audit('CANDIDATE_DELETED', f'Candidate "{name}" removed', g.user.id)
    return jsonify({'message': f'Candidate "{name}" deleted.'}), 200
