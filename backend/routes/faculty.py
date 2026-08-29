"""
Authorized Faculty roster routes.

GET    /api/faculty           — list all authorized faculty (admin)
POST   /api/faculty           — add faculty member (admin)
DELETE /api/faculty/<id>      — remove faculty member (admin)
GET    /api/faculty/check/<id> — check if a Faculty ID is authorized (public for registration)
"""
from flask import Blueprint, request, jsonify, g
from models import db, FacultyDB
from .auth_utils import require_auth, add_audit

faculty_bp = Blueprint('faculty', __name__)


@faculty_bp.route('', methods=['GET'])
@require_auth('admin')
def list_faculty():
    faculty = FacultyDB.query.order_by(FacultyDB.name).all()
    return jsonify({'faculty': [f.to_dict() for f in faculty]}), 200


@faculty_bp.route('', methods=['POST'])
@require_auth('admin')
def add_faculty():
    data       = request.get_json(force=True) or {}
    faculty_id = (data.get('facultyId') or '').strip().upper()
    name       = (data.get('name') or '').strip()
    department = (data.get('department') or '').strip()
    email      = (data.get('email') or '').strip().lower()

    if not faculty_id or not name:
        return jsonify({'error': 'facultyId and name are required.'}), 400

    if FacultyDB.query.filter_by(faculty_id=faculty_id).first():
        return jsonify({'error': 'This Faculty ID is already in the authorized roster.'}), 409

    member = FacultyDB(faculty_id=faculty_id, name=name, department=department, email=email)
    db.session.add(member)
    db.session.commit()

    add_audit('FACULTY_ADDED', f'Faculty "{name}" ({faculty_id}) added to roster', g.user.id)
    return jsonify({'faculty': member.to_dict()}), 201


@faculty_bp.route('/<int:fid>', methods=['DELETE'])
@require_auth('admin')
def delete_faculty(fid):
    member = FacultyDB.query.get_or_404(fid)
    name = member.name
    db.session.delete(member)
    db.session.commit()
    add_audit('FACULTY_REMOVED', f'Faculty "{name}" removed from roster', g.user.id)
    return jsonify({'message': f'Faculty "{name}" removed.'}), 200


@faculty_bp.route('/check/<faculty_id>', methods=['GET'])
def check_faculty(faculty_id):
    """Public endpoint — registration page uses this to validate Faculty ID."""
    member = FacultyDB.query.filter_by(faculty_id=faculty_id.upper()).first()
    if member:
        return jsonify({'authorized': True, 'name': member.name, 'department': member.department}), 200
    return jsonify({'authorized': False}), 200
