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
