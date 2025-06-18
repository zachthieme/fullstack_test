
# Full-Stack Debug & Feature Test

Welcome! This is a full-stack take-home test. The app is partially functional and contains a few bugs. Your task:

1. Debug and fix the application so it runs correctly.
2. Implement filtering and sorting of feedback by rating and date.
3. Refactor any part of the code you find necessary.
4. Add appropriate test coverage.

## How to Run
### Create Database
cd backend 
sqlite3 feedback.db 
paste in the following:
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    rating INTEGER NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
execute: .quit
### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask
pip install flask-cors
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Submission
Push your changes to GitHub and send us the link. Include notes in a PR or README on:
- Bugs you fixed
- Design decisions you made
- Any improvements/refactors
