# TRAC-FAI E-Voting System

**Tawi-Tawi Regional Agricultural College – Faculty Association Incorporated**  
Full-stack voting platform: Flask (Python) backend + HTML/CSS/JS frontend.

---

## Quick Start

### Step 1: Start the Python Backend

```bash
# Option A — Double-click the batch file (Windows)
start-backend.bat

# Option B — Manual
cd backend
pip install -r requirements.txt
python seed.py       # First time only — creates the database
python app.py        # Starts API on http://localhost:5000
```

### Step 2: Serve the Frontend

```bash
# From the project root (trac-fai-voting/)
python -m http.server 8080
```

Then open: **http://localhost:8080**

---

## Default Accounts

| Role  | Username      | Password   |
|-------|---------------|------------|
| Admin | `admin`       | `admin123` |
| Voter | `juandc`      | `voter123` |
| Voter | `mariasantos` | `voter123` |
| Voter | `joserizal`   | `voter123` |

---

## Architecture

```
Browser  ──fetch()──▶  Flask API (port 5000)
                             │
                        SQLite (voting.db)
                        uploads/  (photos)
```

### Backend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login, returns Bearer token |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/auth/register` | Register new voter (pending approval) |
| POST | `/api/auth/change-password` | Change password |
| GET  | `/api/elections` | List all elections |
| POST | `/api/elections` | Create election (admin) |
| PUT  | `/api/elections/<id>` | Update election (admin) |
| DELETE | `/api/elections/<id>` | Delete election (admin) |
| POST | `/api/elections/<id>/reset-votes` | Reset votes (admin) |
| GET  | `/api/candidates` | List candidates |
| POST | `/api/candidates` | Add candidate with photo (admin) |
| PUT  | `/api/candidates/<id>` | Update candidate (admin) |
| DELETE | `/api/candidates/<id>` | Delete candidate (admin) |
| POST | `/api/votes/cast` | Cast a vote (voter) |
| GET  | `/api/votes/receipt/<code>` | Verify receipt |
| GET  | `/api/votes/my/<election_id>` | Check if voted |
| GET  | `/api/votes/results/<election_id>` | Vote counts |
| GET  | `/api/voters` | List voters (admin) |
| PUT  | `/api/voters/<id>` | Update voter status (admin) |
| DELETE | `/api/voters/<id>` | Delete voter (admin) |
| POST | `/api/voters/upload-photo` | Upload profile photo |
| GET  | `/api/audit` | Audit log (admin) |
| GET  | `/api/faculty` | Faculty roster (admin) |
| POST | `/api/faculty` | Add to roster (admin) |
| DELETE | `/api/faculty/<id>` | Remove from roster (admin) |

### Frontend Files

| File | Description |
|------|-------------|
| `js/api.js` | API client (fetch wrapper with Bearer token auth) |
| `js/main.js` | Shared logic: Auth, ElectionDB, Utils, UI managers |
| `login.html` | Login page |
| `register.html` | Voter registration |
| `voter-dashboard.html` | Voter home |
| `voter-vote.html` | Ballot casting |
| `voter-results.html` | View results |
| `voter-profile.html` | Voter profile & settings |
| `admin-dashboard.html` | Admin overview |
| `admin-elections.html` | Manage elections |
| `admin-candidates.html` | Manage candidates + photos |
| `admin-voters.html` | Manage voter accounts |
| `admin-results.html` | View detailed results |
| `admin-audit.html` | Audit trail |

---

## Project Structure

```
trac-fai-voting/
├── backend/
│   ├── app.py              Flask entry point
│   ├── models.py           SQLAlchemy models
│   ├── seed.py             Database seeder
│   ├── requirements.txt    Python dependencies
│   ├── voting.db           SQLite database (auto-created)
│   ├── uploads/            Candidate/voter photos
│   └── routes/
│       ├── auth.py
│       ├── elections.py
│       ├── candidates.py
│       ├── votes.py
│       ├── voters.py
│       ├── audit.py
│       └── faculty.py
├── css/                    Stylesheets
├── js/
│   ├── api.js              API client layer
│   └── main.js             Shared app logic
├── img/                    Images & logo
├── *.html                  Frontend pages
├── start-backend.bat       One-click startup (Windows)
└── README.md               This file
```

---

## Security Notes

- Passwords are hashed with `werkzeug.security` (pbkdf2:sha256)
- Bearer tokens are stored in `localStorage` and sent as `Authorization` headers
- Votes enforce one-per-voter-per-election at the database level (unique constraint)
- Candidate photos stored with random UUID filenames in `backend/uploads/`
- CORS restricted to `localhost:8080`
