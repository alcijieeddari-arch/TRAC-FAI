"""
Audit log routes.

GET /api/audit          — paginated audit log (admin)
GET /api/audit/export   — full audit log for CSV export (admin)
"""
from flask import Blueprint, request, jsonify
from models import AuditLog
from .auth_utils import require_auth

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('', methods=['GET'])
@require_auth('admin')
def list_logs():
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    action   = request.args.get('action')  # Optional filter

    q = AuditLog.query
    if action:
        q = q.filter(AuditLog.action.ilike(f'%{action}%'))
    q = q.order_by(AuditLog.timestamp.desc())

    paginated = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'logs':    [log.to_dict() for log in paginated.items],
        'total':   paginated.total,
        'pages':   paginated.pages,
        'current': page
    }), 200


@audit_bp.route('/export', methods=['GET'])
@require_auth('admin')
def export_logs():
    """Return all audit logs for CSV export (no pagination)."""
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(1000).all()
    return jsonify({'logs': [log.to_dict() for log in logs]}), 200


@audit_bp.route('/log', methods=['POST'])
@require_auth()
def add_log():
    """Add an audit log entry from frontend."""
    from flask import g
    from .auth_utils import add_audit
    data = request.get_json(force=True) or {}
    action = data.get('action', 'FRONTEND_ACTION')
    description = data.get('description', '')
    add_audit(action, description, g.user.id)
    return jsonify({'message': 'Logged'}), 201
