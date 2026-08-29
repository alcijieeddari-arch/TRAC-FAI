"""
TRAC-FAI Voting System — Flask Application Entry Point
Run: python app.py
API available at: http://localhost:5000/api
"""
import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from models import db

# ── Import route blueprints ──
from routes.auth       import auth_bp
from routes.elections  import elections_bp
from routes.candidates import candidates_bp
from routes.votes      import votes_bp
from routes.voters     import voters_bp
from routes.audit      import audit_bp
from routes.faculty    import faculty_bp

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
DB_PATH     = os.path.join(BASE_DIR, 'voting.db')

def create_app():
    app = Flask(__name__, static_folder=None)

    # ── Config ──
    app.config['SECRET_KEY']                         = 'tracfai-secret-2025-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI']            = f'sqlite:///{DB_PATH}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS']     = False
    app.config['MAX_CONTENT_LENGTH']                 = 5 * 1024 * 1024   # 5 MB upload limit
    app.config['UPLOAD_FOLDER']                      = UPLOADS_DIR

    # ── CORS: allow frontend dev server and any local origin ──
    CORS(app, resources={r"/*": {"origins": "*"}})

    # ── Init DB ──
    db.init_app(app)

    with app.app_context():
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        db.create_all()

    # ── Register blueprints ──
    app.register_blueprint(auth_bp,       url_prefix='/api/auth')
    app.register_blueprint(elections_bp,  url_prefix='/api/elections')
    app.register_blueprint(candidates_bp, url_prefix='/api/candidates')
    app.register_blueprint(votes_bp,      url_prefix='/api/votes')
    app.register_blueprint(voters_bp,     url_prefix='/api/voters')
    app.register_blueprint(audit_bp,      url_prefix='/api/audit')
    app.register_blueprint(faculty_bp,    url_prefix='/api/faculty')

    # ── Serve uploaded files ──
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(UPLOADS_DIR, filename)

    # ── Health check ──
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'system': 'TRAC-FAI Voting System'})

    # ── Generic error handlers ──
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed'}), 405

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({'error': 'File too large. Maximum 5 MB allowed.'}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

    return app


app = create_app()

if __name__ == '__main__':
    print("=" * 60)
    print(" TRAC-FAI Voting System — Python Backend")
    print(" API: http://localhost:5000/api")
    print(" Uploads: http://localhost:5000/uploads/")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
