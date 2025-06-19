
# Project Setup and Progress Notes

## Bugs Resolved
- **app.py was missing the app.run()** Without this the backend was not starting.
- **App.jsx missing react scaffolding** The package.json and other files were missing for a minimal react app.
- **No SQLite db** The backend uses sqlite for a storage layer but there was no code to setup the database with the proper tables.
- **App.jsx expects JSON** the /feedback route returned a python array of arrays not a json payload like the front end expected.
- **No Requirements.txt** Requirements.txt did not exist so any dependencies needed to be hand managed.
- **SQL Injection Risk** The backend did not properly handle user input. 

## Design Decisions
### SQL
- Stored dates in UTC to better allow dates to be localized for the user.
- used sqlite row_factory to extract a dictionary for each record instead of just the results. This made for less post processing of the data.
- used "where 1=1" trick in sql query to allow the filtering by date/starts to be additive AND statements.
- did not use a composite index on the table which would help on query times - however if you are to the point where you need an index you probably need a better data store.
- used parameters in cursor.execute to ensure that injection wasn't possible.

### UI
- updated the ratings to be actual stars in the drop-down instead of just word/numbers.
- made the "add feedback" section hide-able so that it doesn't add visual clutter when it isn't needed.
- made the ASC/DESC "Newest First" and "Oldest First" to make simpler for the user to understand.
- made it possible to sort by either starts or date - the requirements were vague so i figured i'd start here and if required make it more complex. You could imagine a sort/sub-sort or a group by and then sort.

### Improvements
- **Identity** the application currently doesn't have any concept of identity. All users are the same users. if this is going to be used by multiple people it should have some auth-n/z and RBAC to allow for users to determine what is public/private and what rights others have to modify items.
  - There should be some integration with a cloud login provider (apple, google, amazon, facebook) so that people can login with credentials they already have for ease of use.
- **Security** These endpoints are all over HTTP and there is no authentication between the front end and the backend. This should all be moved to https and leverage some form of token based auth. Additionally if we are doing a multi-user app we should consider encryption at rest and even GDPR.
- **Internationalization** This is only in english and if it is to be used in other countries it should be made to work in their language.
- **Accessibility** This was built without any accessibility in mind.
- **Flair** The UX is bare bones - better use of color, size, shading, better controls (fewer drop-downs) would go a long way.
- **Usability** The current implementation doesn't allow for the UD operations of CRUD.

## Initial investigation and approach (actual log of investigation and work)

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
- added input validating for rating and updated tests
- noticed that the dates in the ui are displaying as a day in the past eventhough the backend is sending the correct dates. resolved by properly using utc through the app.
- added the ability to sort by either stars or date


# APPENDIX - Raw Notes
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
