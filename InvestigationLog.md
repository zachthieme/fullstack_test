
# Project Setup and Progress Notes

## Setup and Initial Fixes

### Backend
- Followed instructions in the README.
- Initially, `app.py` ran without errors but exited immediately.
  - **Issue**: `app.run()` was missing.
  - **Fix**: Added `app.run()` — backend now starts properly.
- Tested the `/feedback` route — received error: _"no such table: feedback"_.
  - **Issue**: SQLite database wasn't initialized.
  - **Fix**: 
    - Created `feedback.db` and the required `feedback` table.
    - Added a test record.
    - Verified that the GET endpoint returns the added data.
  - **Update**: README updated to reflect these steps.

### Frontend
- `npm install` failed — no `package.json`.
  - **Fix**: Used `npx create-react-app app` to bootstrap a basic React app.
- Updated `.gitignore` to exclude:
  - `node_modules`
  - `venv`
  - `feedback.db`

## SQLite Schema

### Minimal SQLite Requirements
- **Database**: `feedback.db`
- **Table**: `feedback`
- **Fields**:
  - `id` (INTEGER)
  - `message` (TEXT)
  - `rating` (INTEGER)
  - `created_at` (DATE)

## Backend Enhancements

- Began refactoring backend:
  - Improved error handling.
  - Removed potential SQL injection vulnerabilities.
  - Added some default records to the database.

## Frontend & Backend Integration

- Connected frontend to backend — initial request failed due to non-JSON response.
  - **Troubleshooting** (via Chrome DevTools):
    - Identified and resolved CORS errors:
      - Added CORS support.
      - Configured frontend proxy to `127.0.0.1`.
    - Adjusted backend output to return valid JSON.
- UI improvements:
  - Added dropdown options for all ratings.
  - Implemented date filtering.
    - Debugged a `400` error — root cause: incorrect date format (`m%` instead of `%m` in `%Y-%m-%d`).
  - Added sorting functionality.
  - Made minor visualization tweaks.

## Final Updates

- Created `requirements.txt`.
- Updated README:
  - Documented use of `requirements.txt`.
  - Removed manual DB setup instructions (now handled in `app.py`).
- Added basic "create" workflow (for adding new feedback).
- added tests via claude 4.0


# Raw Notes
* follow instructions in the readme
  * Backend: no errors on install app.py runs and immediately completes
    * backend is missing the app.run - added and now the backend starts
    * tested the feedback route and it fails as there is no such table as feedback
    * there is no migration file or anything for populating the sqlite database. 
      * created sqlite file and table and updated readme 
      * added record into db and confirmed that GET call returns the data i added
  * Frontend: npm install fails: no package.json  
    * used `npx create-react-app app` to create a templated react project
    * added node_modules,venv, feedback.db to .gitignore


Minimal SQLite requirements from existing code
SQLite DB: feedback.db
table name: feedback
fields: message (text), rating (int), created_at (date)

* started minor refactor on backend to remove sql injection and add better errors
  * added some default records to the database 
* wired front end to backend got an error as the results are not in json
  * used chrome devtools to find cors error messages  
  * added CORS 
  * added proxy (made sure it was 127.0.0.1)
  * tweaked the output to be JSON  
* added the rest of the ratings to the drop down
* added date filters
  * used chrome dev tools/some debug messages to troubleshoot the reason i was getting a 400 on my date filters. It was a typo m% instead of %m in the %Y-%m-%d on my exception
* added sort 
* minor visualization tweak
* added requirements.txt
* updated readme to inlclude using requirements.txt and removed db creation stuff as i added it to app.py
* added a create workflow 
