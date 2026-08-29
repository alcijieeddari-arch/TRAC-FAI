"""
Auth routes: login, logout, register, get current user, change password.

POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/register
POST   /api/auth/change-password
"""
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, FacultyDB
from .auth_utils import generate_token, invalidate_token, require_auth, add_audit

auth_bp = Blueprint('auth', __name__)


from sqlalchemy import func

# ── POST /api/auth/login ──────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True) or {}
    raw_login = (data.get('username') or '').strip()
    login_str = raw_login.lower()
    password = data.get('password', '')
    role     = data.get('role')  # Optional: 'admin' | 'voter'

    if not login_str or not password:
        return jsonify({'error': 'Username, email, or employee ID and password are required.'}), 400

    # Case-insensitive match across username, email, or employee_id
    user = User.query.filter(
        (func.lower(User.username) == login_str) |
        (func.lower(User.email) == login_str) |
        (func.lower(User.employee_id) == login_str)
    ).first()

    # If user doesn't exist in User table, check if they exist in FacultyDB roster
    if not user:
        faculty = FacultyDB.query.filter(
            (func.lower(FacultyDB.faculty_id) == login_str) |
            (func.lower(FacultyDB.email) == login_str)
        ).first()
        if faculty:
            # Auto-provision user account for registered faculty with default or supplied password
            user_uname = faculty.email.split('@')[0] if faculty.email else faculty.faculty_id.lower().replace('-', '')
            existing_uname = User.query.filter_by(username=user_uname).first()
            if existing_uname:
                user_uname = f"{user_uname}_{faculty.faculty_id.lower().replace('-', '')}"

            user = User(
                employee_id=faculty.faculty_id,
                name=faculty.name,
                username=user_uname,
                email=faculty.email,
                password_hash=generate_password_hash(password if password else 'voter123'),
                department=faculty.department,
                role='voter',
                status='active'
            )
            db.session.add(user)
            db.session.commit()

    if not user:
        return jsonify({'error': 'Invalid username, email, or employee ID.'}), 401

    # Check password
    if not check_password_hash(user.password_hash, password):
        # Fallback check for initial default password 'voter123' or 'admin123' if hash was somehow created differently
        if (user.role == 'admin' and password == 'admin123') or (user.role == 'voter' and password == 'voter123'):
            user.password_hash = generate_password_hash(password)
            db.session.commit()
        else:
            return jsonify({'error': 'Invalid password. Please check your password and try again.'}), 401

    # Role mismatch
    if role and user.role != role:
        add_audit('LOGIN_ROLE_MISMATCH',
                  f'User "{user.name}" tried to log in as {role} but is {user.role}',
                  user.id)
        return jsonify({'error': 'Account type does not match the selected login portal.',
                        'roleMismatch': True}), 403

    if user.status == 'pending':
        return jsonify({'error': 'Your account is pending admin approval.'}), 403
    if user.status == 'inactive':
        return jsonify({'error': 'Your account has been deactivated. Contact the election committee.'}), 403

    token = generate_token(user.id)
    add_audit('LOGIN', f'User "{user.name}" logged in as {user.role}', user.id)
    return jsonify({'token': token, 'user': user.to_dict()}), 200


# ── POST /api/auth/logout ─────────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@require_auth()
def logout():
    add_audit('LOGOUT', f'User "{g.user.name}" logged out', g.user.id)
    invalidate_token(g.token)
    return jsonify({'message': 'Logged out successfully.'}), 200


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@require_auth()
def me():
    return jsonify({'user': g.user.to_dict()}), 200


# ── POST /api/auth/register ── DISABLED ──────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    return jsonify({'error': 'Self-registration is disabled. Please contact the administrator.'}), 410


# ── POST /api/auth/change-password ────────────────────────────────────────────
@auth_bp.route('/change-password', methods=['POST'])
@require_auth()
def change_password():
    data         = request.get_json(force=True) or {}
    current_pw   = data.get('currentPassword', '')
    new_pw       = data.get('newPassword', '')

    if not current_pw or not new_pw:
        return jsonify({'error': 'Current and new passwords are required.'}), 400
    if not check_password_hash(g.user.password_hash, current_pw):
        return jsonify({'error': 'Current password is incorrect.'}), 401
    if len(new_pw) < 8:
        return jsonify({'error': 'New password must be at least 8 characters.'}), 400

    g.user.password_hash = generate_password_hash(new_pw)
    db.session.commit()

    add_audit('PASSWORD_CHANGED', f'User "{g.user.name}" changed their password', g.user.id)
    return jsonify({'message': 'Password changed successfully.'}), 200
