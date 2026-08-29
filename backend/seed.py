"""
TRAC-FAI Voting System -- Database Seeder
Run ONCE to initialize the database with default data.

Usage:
    cd backend
    python seed.py
"""
import sys
import os
import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Election, Candidate, FacultyDB

app = create_app()

FACULTY_ROSTER = [
    ('FAC-0001', 'Dr. Maria Santos',       'Mathematics',          'maria.santos@trac-fai.edu.ph'),
    ('FAC-0002', 'Prof. Roberto Cruz',     'Engineering',          'roberto.cruz@trac-fai.edu.ph'),
    ('FAC-0003', 'Dr. Ana Reyes',          'Science',              'ana.reyes@trac-fai.edu.ph'),
    ('FAC-0004', 'Prof. Jose Mercado',     'Filipino',             'jose.mercado@trac-fai.edu.ph'),
    ('FAC-0005', 'Dr. Linda Gomez',        'Social Studies',       'linda.gomez@trac-fai.edu.ph'),
    ('FAC-0006', 'Prof. Carmen Dela Cruz', 'English',              'carmen.delacruz@trac-fai.edu.ph'),
    ('FAC-0007', 'Prof. Marco Villanueva', 'History',              'marco.villanueva@trac-fai.edu.ph'),
    ('FAC-0008', 'Dr. Patricia Tan',       'Accounting',           'patricia.tan@trac-fai.edu.ph'),
    ('FAC-0009', 'Prof. Eduardo Santos',   'Business',             'eduardo.santos@trac-fai.edu.ph'),
    ('FAC-0010', 'Dr. Fernando Lim',       'Economics',            'fernando.lim@trac-fai.edu.ph'),
    ('FAC-0011', 'Dr. Lorna Magno',        'Nursing',              'lorna.magno@trac-fai.edu.ph'),
    ('FAC-0012', 'Prof. Ricardo Bautista', 'Architecture',         'ricardo.bautista@trac-fai.edu.ph'),
    ('FAC-0013', 'Dr. Teresa Aquino',      'Psychology',           'teresa.aquino@trac-fai.edu.ph'),
    ('FAC-0014', 'Prof. Andres Garcia',    'Computer Science',     'andres.garcia@trac-fai.edu.ph'),
    ('FAC-0015', 'Dr. Rosario Mendoza',    'Biology',              'rosario.mendoza@trac-fai.edu.ph'),
    ('FAC-0016', 'Prof. Miguel Ramos',     'Physical Education',   'miguel.ramos@trac-fai.edu.ph'),
    ('FAC-0017', 'Dr. Sophia Valdez',      'Chemistry',            'sophia.valdez@trac-fai.edu.ph'),
    ('FAC-0018', 'Prof. Enrique Torres',   'Philosophy',           'enrique.torres@trac-fai.edu.ph'),
    ('FAC-0019', 'Dr. Gloria Navarro',     'Political Science',    'gloria.navarro@trac-fai.edu.ph'),
    ('FAC-0020', 'Prof. Benjamin Castillo','Fine Arts',            'benjamin.castillo@trac-fai.edu.ph'),
    ('FAC-0042', 'Dr. Juan Dela Cruz',     'Science Department',   'juan.delacruz@trac-fai.edu.ph'),
    ('FAC-0085', 'Prof. Maria Santos',     'Mathematics Department','maria.santos2@trac-fai.edu.ph'),
    ('FAC-0103', 'Dr. Jose Rizal',         'Filipino Department',  'jose.rizal@trac-fai.edu.ph'),
]

SAMPLE_VOTERS = [
    ('FAC-0042', 'Dr. Juan Dela Cruz',  'juandc',      'juan.delacruz@trac-fai.edu.ph', 'Science Department'),
    ('FAC-0085', 'Prof. Maria Santos',  'mariasantos', 'maria.santos2@trac-fai.edu.ph', 'Mathematics Department'),
    ('FAC-0103', 'Dr. Jose Rizal',      'joserizal',   'jose.rizal@trac-fai.edu.ph',    'Filipino Department'),
]

POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor']

CANDIDATES = [
    ('Dr. Maria Santos',       'President',      'Progressive Alliance', 'Education reform, faculty welfare, and digital transformation.', 'Mathematics'),
    ('Prof. Roberto Cruz',     'President',      'United Faculty',       'Strengthening faculty rights and improving academic facilities.', 'Engineering'),
    ('Dr. Ana Reyes',          'President',      'Independent',          'Transparent governance and inclusive faculty representation.', 'Science'),
    ('Prof. Jose Mercado',     'Vice President', 'Progressive Alliance', 'Modernizing curriculum and research programs.', 'Filipino'),
    ('Dr. Linda Gomez',        'Vice President', 'United Faculty',       'Faculty empowerment and professional development.', 'Social Studies'),
    ('Prof. Carmen Dela Cruz', 'Secretary',      'Progressive Alliance', 'Efficient record-keeping and transparent communication.', 'English'),
    ('Prof. Marco Villanueva', 'Secretary',      'United Faculty',       'Digitizing faculty records and improving correspondence.', 'History'),
    ('Dr. Patricia Tan',       'Treasurer',      'Progressive Alliance', 'Fiscal responsibility and transparent financial reporting.', 'Accounting'),
    ('Prof. Eduardo Santos',   'Treasurer',      'United Faculty',       'Maximizing faculty fund benefits and budget efficiency.', 'Business'),
    ('Dr. Fernando Lim',       'Auditor',        'Independent',          'Independent financial oversight and accountability.', 'Economics'),
]


def seed():
    with app.app_context():
        db.create_all()
        print("Tables created.")

        # Admin
        if not User.query.filter_by(username='admin').first():
            admin = User(
                employee_id='EMP-001',
                name='Administrator',
                username='admin',
                email='admin@trac-fai.edu.ph',
                password_hash=generate_password_hash('admin123'),
                department='IT Department',
                role='admin',
                status='active'
            )
            db.session.add(admin)
            print("Admin account created  (admin / admin123)")
        else:
            print("Admin already exists -- skipped.")

        # Sample voters
        for emp_id, name, username, email, dept in SAMPLE_VOTERS:
            if not User.query.filter_by(username=username).first():
                voter = User(
                    employee_id=emp_id,
                    name=name,
                    username=username,
                    email=email,
                    password_hash=generate_password_hash('voter123'),
                    department=dept,
                    role='voter',
                    status='active'
                )
                db.session.add(voter)
                print(f"Voter created: {username} / voter123")
            else:
                print(f"Voter '{username}' already exists -- skipped.")

        # Faculty roster
        for fac_id, name, dept, email in FACULTY_ROSTER:
            if not FacultyDB.query.filter_by(faculty_id=fac_id).first():
                db.session.add(FacultyDB(faculty_id=fac_id, name=name, department=dept, email=email))
        print("Faculty roster seeded.")

        db.session.commit()

        # Sample Election
        if not Election.query.first():
            now = datetime.utcnow()
            election = Election(
                title='AY 2025-2026 Faculty Organization Election',
                description='Annual election for the Tawi-Tawi Regional Agricultural College Faculty Association Incorporated officers for Academic Year 2025-2026.',
                start_date=now - timedelta(days=1),
                end_date=now + timedelta(days=6),
                positions=json.dumps(POSITIONS),
                total_voters=247,
            )
            db.session.add(election)
            db.session.flush()

            for name, position, party, platform, dept in CANDIDATES:
                db.session.add(Candidate(
                    election_id=election.id,
                    name=name,
                    position=position,
                    party=party,
                    platform=platform,
                    department=dept,
                    status='active'
                ))
            db.session.commit()
            print(f"Sample election created with {len(CANDIDATES)} candidates.")
        else:
            print("Election already exists -- skipped.")

        print("")
        print("=" * 55)
        print("  TRAC-FAI Database Seeding Complete!")
        print("  Admin Login:  admin / admin123")
        print("  Voter Login:  juandc / voter123")
        print("=" * 55)
        print("")
        print("Next: python app.py  -->  http://localhost:5000/api")


if __name__ == '__main__':
    seed()
