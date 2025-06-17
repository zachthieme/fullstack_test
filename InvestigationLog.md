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
