import hmac
import hashlib
import time
import secrets
import json
from functools import wraps
from datetime import datetime
from flask import request, jsonify, current_app, g
from models import db, User, AuditLog

_revoked_tokens = set()
_legacy_tokens: dict[str, int] = {}
AUTH_SECRET = 'tracfai-secure-auth-secret-key-2025'

def _sign_payload(payload: str) -> str:
    secret = current_app.config.get('SECRET_KEY', AUTH_SECRET) if current_app else AUTH_SECRET
    return hmac.new(secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()[:32]

def generate_token(user_id: int) -> str:
    ts = int(time.time())
    payload = f"{user_id}:{ts}"
    sig = _sign_payload(payload)
    token = f"{user_id}.{ts}.{sig}"
    _legacy_tokens[token] = user_id
    return token

def invalidate_token(token: str):
    _revoked_tokens.add(token)
    _legacy_tokens.pop(token, None)

def get_user_from_token(token: str):
    if not token or token in _revoked_tokens:
        return None

    # Check legacy token map
    if token in _legacy_tokens:
        return User.query.get(_legacy_tokens[token])

    # Check HMAC signed token: user_id.timestamp.signature
    parts = token.split('.')
    if len(parts) == 3:
        try:
            user_id = int(parts[0])
            ts = int(parts[1])
            sig = parts[2]

            # 30-day token lifetime
            if (time.time() - ts) > (30 * 86400):
                return None

            expected_sig = _sign_payload(f"{user_id}:{ts}")
            if hmac.compare_digest(sig, expected_sig):
                return User.query.get(user_id)
        except Exception:
            return None

    return None


def require_auth(role: str = None):
    """Decorator: validates Bearer token, injects g.user. Optionally checks role."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authentication required.'}), 401
            token = auth_header[7:]
            user = get_user_from_token(token)
            if not user:
                return jsonify({'error': 'Invalid or expired session. Please log in again.'}), 401
            if user.status != 'active':
                return jsonify({'error': 'Your account is not active.'}), 403
            if role and user.role != role:
                return jsonify({'error': f'Access restricted to {role} accounts.'}), 403
            g.user = user
            g.token = token
            return f(*args, **kwargs)
        return wrapped
    return decorator


def add_audit(action: str, description: str, user_id: int = None, ip: str = None):
    """Record an audit log entry."""
    if ip is None:
        ip = request.remote_addr or '0.0.0.0'
    log = AuditLog(
        user_id=user_id,
        action=action,
        description=description,
        ip_address=ip,
        timestamp=datetime.utcnow()
    )
    db.session.add(log)
    db.session.commit()
