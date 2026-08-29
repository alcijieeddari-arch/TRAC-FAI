"""
Voters (user management) routes.

GET    /api/voters                 — list all voters (admin)
GET    /api/voters/<id>            — get single voter (admin)
PUT    /api/voters/<id>            — update voter status/info (admin)
DELETE /api/voters/<id>            — remove voter account (admin)
POST   /api/voters/upload-photo    — voter uploads own profile photo
"""
import os
import uuid
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from models import db, User
from .auth_utils import require_auth, add_audit

voters_bp = Blueprint('voters', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── GET /api/voters ───────────────────────────────────────────────────────────
@voters_bp.route('', methods=['GET'])
@require_auth('admin')
def list_voters():
    status = request.args.get('status')  # Optional filter: active|pending|inactive
    q = User.query.filter_by(role='voter')
    if status:
        q = q.filter_by(status=status)
    voters = q.order_by(User.name).all()
    return jsonify({'voters': [v.to_dict() for v in voters]}), 200


# ── POST /api/voters ──────────────────────────────────────────────────────────
@voters_bp.route('', methods=['POST'])
@require_auth('admin')
def create_voter():
    from werkzeug.security import generate_password_hash
    data = request.get_json(force=True) or {}
    name = (data.get('name') or '').strip()
    username = (data.get('username') or '').strip().lower()
    email = (data.get('email') or '').strip().lower()
    employee_id = (data.get('employeeId') or '').strip()
    department = (data.get('department') or '').strip()
    password = data.get('password') or 'voter123'
    status = data.get('status', 'active')

    if not name or not username:
        return jsonify({'error': 'Name and username are required.'}), 400

    existing = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing:
        return jsonify({'error': f'A user with username "{username}" or email "{email}" already exists.'}), 400

    new_voter = User(
        name=name,
        username=username,
        email=email,
        employee_id=employee_id,
        department=department,
        password_hash=generate_password_hash(password),
        role='voter',
        status=status
    )
    db.session.add(new_voter)
    db.session.commit()

    add_audit('VOTER_CREATED', f'Admin created voter account "{name}" (@{username})', g.user.id)
    return jsonify({'voter': new_voter.to_dict()}), 201


# ── GET /api/voters/<id> ──────────────────────────────────────────────────────
@voters_bp.route('/<int:vid>', methods=['GET'])
@require_auth('admin')
def get_voter(vid):
    voter = User.query.get_or_404(vid)
    return jsonify({'voter': voter.to_dict()}), 200


# ── PUT /api/voters/<id> ──────────────────────────────────────────────────────
@voters_bp.route('/<int:vid>', methods=['PUT'])
@require_auth('admin')
def update_voter(vid):
    voter = User.query.get_or_404(vid)
    data  = request.get_json(force=True) or {}

    old_status = voter.status
    if 'status' in data and data['status'] in ('active', 'pending', 'inactive'):
        voter.status = data['status']
    if 'name'       in data: voter.name       = data['name'].strip()
    if 'email'      in data: voter.email       = data['email'].strip().lower()
    if 'department' in data: voter.department  = data['department'].strip()

    db.session.commit()

    if old_status != voter.status:
        add_audit('VOTER_STATUS_CHANGED',
                  f'Voter "{voter.name}" status changed from {old_status} to {voter.status}',
                  g.user.id)
    else:
        add_audit('VOTER_UPDATED', f'Voter "{voter.name}" profile updated', g.user.id)

    return jsonify({'voter': voter.to_dict()}), 200


# ── DELETE /api/voters/<id> ───────────────────────────────────────────────────
@voters_bp.route('/<int:vid>', methods=['DELETE'])
@require_auth('admin')
def delete_voter(vid):
    voter = User.query.get_or_404(vid)
    if voter.role == 'admin':
        return jsonify({'error': 'Cannot delete admin accounts.'}), 403
    name = voter.name
    db.session.delete(voter)
    db.session.commit()
    add_audit('VOTER_DELETED', f'Voter account "{name}" deleted', g.user.id)
    return jsonify({'message': f'Voter "{name}" deleted.'}), 200


# ── POST /api/voters/upload-photo ─────────────────────────────────────────────
@voters_bp.route('/upload-photo', methods=['POST'])
@require_auth()
def upload_photo():
    photo_url = None
    if request.content_type and 'multipart/form-data' in request.content_type:
        file = request.files.get('photo')
        if file and file.filename != '' and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            upload_dir = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            photo_url = f"/uploads/{filename}"
    else:
        data = request.get_json(force=True) or {}
        photo_url = data.get('photoUrl') or data.get('photo')

    if not photo_url:
        return jsonify({'error': 'No valid photo provided.'}), 400

    g.user.photo_url = photo_url
    db.session.commit()

    add_audit('PROFILE_PHOTO_UPDATED', f'User "{g.user.name}" updated profile photo', g.user.id)
    return jsonify({'photoUrl': photo_url, 'user': g.user.to_dict()}), 200


# ── DELETE /api/voters/upload-photo ───────────────────────────────────────────
@voters_bp.route('/upload-photo', methods=['DELETE'])
@require_auth()
def remove_photo():
    g.user.photo_url = None
    db.session.commit()
    add_audit('PROFILE_PHOTO_REMOVED', f'User "{g.user.name}" removed profile photo', g.user.id)
    return jsonify({'message': 'Profile photo removed.', 'user': g.user.to_dict()}), 200
