"""
TRAC-FAI Voting System — SQLAlchemy Database Models
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    employee_id   = db.Column(db.String(50), unique=True, nullable=False)
    name          = db.Column(db.String(150), nullable=False)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    department    = db.Column(db.String(150))
    role          = db.Column(db.String(20), default='voter')   # 'admin' | 'voter'
    status        = db.Column(db.String(20), default='pending') # 'active' | 'pending' | 'inactive'
    photo_url     = db.Column(db.String(300))
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    votes = db.relationship('Vote', backref='voter', lazy=True)
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)

    def to_dict(self, include_sensitive=False):
        d = {
            'id':          self.id,
            'employeeId':  self.employee_id,
            'name':        self.name,
            'username':    self.username,
            'email':       self.email,
            'department':  self.department,
            'role':        self.role,
            'status':      self.status,
            'photoUrl':    self.photo_url,
            'createdAt':   self.created_at.isoformat() if self.created_at else None,
        }
        return d


class Election(db.Model):
    __tablename__ = 'elections'
    id            = db.Column(db.Integer, primary_key=True)
    title         = db.Column(db.String(250), nullable=False)
    description   = db.Column(db.Text)
    start_date    = db.Column(db.DateTime, nullable=False)
    end_date      = db.Column(db.DateTime, nullable=False)
    status        = db.Column(db.String(20), default='upcoming') # 'upcoming'|'ongoing'|'closed'
    forced_status = db.Column(db.String(20), nullable=True)       # Admin override
    positions     = db.Column(db.Text)   # JSON array of position names
    total_voters  = db.Column(db.Integer, default=0)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    candidates = db.relationship('Candidate', backref='election', lazy=True, cascade='all, delete-orphan')
    votes      = db.relationship('Vote', backref='election', lazy=True, cascade='all, delete-orphan')

    def auto_status(self):
        """Compute status. Respects forced_status if set by admin."""
        if self.forced_status:
            return self.forced_status
        now = datetime.utcnow()
        if now < self.start_date:
            return 'upcoming'
        elif now <= self.end_date:
            return 'ongoing'
        else:
            return 'closed'

    def to_dict(self):
        import json
        positions = []
        try:
            raw = self.positions or ''
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                positions = [p.strip() for p in parsed if p.strip()]
            else:
                positions = [str(parsed).strip()] if parsed else []
        except Exception:
            # Fallback: comma or space-separated string
            raw = self.positions or ''
            if ',' in raw:
                positions = [p.strip() for p in raw.split(',') if p.strip()]
            else:
                positions = [p.strip() for p in raw.split() if p.strip()]
        return {
            'id':           self.id,
            'title':        self.title,
            'description':  self.description,
            'startDate':    self.start_date.isoformat() if self.start_date else None,
            'endDate':      self.end_date.isoformat() if self.end_date else None,
            'status':       self.auto_status(),
            'positions':    positions,
            'totalVoters':  self.total_voters,
            'createdAt':    self.created_at.isoformat() if self.created_at else None,
            'votersTurnout': len(self.votes),
        }


class Candidate(db.Model):
    __tablename__ = 'candidates'
    id          = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id'), nullable=False)
    name        = db.Column(db.String(150), nullable=False)
    position    = db.Column(db.String(100), nullable=False)
    party       = db.Column(db.String(150))
    platform    = db.Column(db.Text)
    department  = db.Column(db.String(150))
    photo_url   = db.Column(db.String(300))
    status      = db.Column(db.String(20), default='active')  # 'active' | 'disqualified'
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'electionId':  self.election_id,
            'election_id': self.election_id,
            'name':        self.name,
            'position':    self.position,
            'party':       self.party,
            'platform':    self.platform,
            'department':  self.department,
            'photoUrl':    self.photo_url,
            'photo':       self.photo_url,
            'status':      self.status,
        }


class Vote(db.Model):
    __tablename__ = 'votes'
    id           = db.Column(db.Integer, primary_key=True)
    election_id  = db.Column(db.Integer, db.ForeignKey('elections.id'), nullable=False)
    voter_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    selections   = db.Column(db.Text, nullable=False)  # JSON: {position: candidateId}
    receipt_code = db.Column(db.String(50), unique=True, nullable=False)
    timestamp    = db.Column(db.DateTime, default=datetime.utcnow)
    vote_hash    = db.Column(db.String(200))

    __table_args__ = (
        db.UniqueConstraint('election_id', 'voter_id', name='uq_one_vote_per_election'),
    )

    def to_dict(self):
        return {
            'id':          self.id,
            'electionId':  self.election_id,
            'voterId':     self.voter_id,
            'receiptCode': self.receipt_code,
            'timestamp':   self.timestamp.isoformat() if self.timestamp else None,
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action      = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    ip_address  = db.Column(db.String(50))
    timestamp   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'userId':      self.user_id,
            'userName':    self.user.name if self.user else None,
            'action':      self.action,
            'description': self.description,
            'ip':          self.ip_address,
            'timestamp':   self.timestamp.isoformat() if self.timestamp else None,
        }


class FacultyDB(db.Model):
    __tablename__ = 'faculty_db'
    id         = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.String(50), unique=True, nullable=False)
    name       = db.Column(db.String(150), nullable=False)
    department = db.Column(db.String(150))
    email      = db.Column(db.String(150))

    def to_dict(self):
        return {
            'id':         self.id,
            'facultyId':  self.faculty_id,
            'name':       self.name,
            'department': self.department,
            'email':      self.email,
        }
