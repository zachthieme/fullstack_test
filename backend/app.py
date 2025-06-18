# app.py - Mock Flask backend (with bugs)
import sqlite3
import os
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from datetime import datetime, timezone


def check_and_init_db():
    db_path = "feedback.db"
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
    );
    """

    # create sqlite db if it doesn't exist
    if not os.path.exists(db_path):
        print("[INFO] feedback.db not found. Creating...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(create_table_sql)
        conn.commit()
        conn.close()
    else:
        # make sure table exists
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(create_table_sql)
        conn.commit()
        conn.close()


app = Flask(__name__)
CORS(app)


@app.route("/feedback", methods=["GET"])
def get_feedback():
    conn = sqlite3.connect("feedback.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    rating = request.args.get("rating", type=int)
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    sort = request.args.get("sort", "desc").lower()

    if sort not in ["asc", "desc"]:
        sort = "desc"

    query = "SELECT id, message, rating, created_at FROM feedback WHERE 1=1"
    params = []

    if rating is not None:
        query += " AND rating = ?"
        params.append(rating)

    def validate_iso(date_str, label):
        try:
            return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
        except ValueError:
            abort(400, f"Invalid {label} date: use YYYY-MM-DD")

    if from_date:
        validate_iso(from_date, "from")
        query += " AND date(created_at) >= date(?)"
        params.append(from_date)

    if to_date:
        validate_iso(to_date, "to")
        query += " AND date(created_at) <= date(?)"
        params.append(to_date)

    query += f" ORDER BY created_at {sort}"  # leaving as f-string i've ensured that it can only be asc/desc and can use params as asc/desc are keywords

    try:
        rows = cursor.execute(query, params).fetchall()
    finally:
        conn.close()

    return jsonify([dict(row) for row in rows])


@app.route("/feedback", methods=["POST"])
def post_feedback():
    data = request.get_json()
    conn = sqlite3.connect("feedback.db")
    cursor = conn.cursor()

    message = data.get("message")
    rating = data.get("rating")
    # TODO: make FE handle timezones
    created_at = datetime.now(timezone.utc).isoformat()

    # confirm that there is a value provided - in a production system we would want distinct errors to track issues faster
    if message is None or rating is None:
        return jsonify({"error": "Missing 'message' or 'rating'"}), 400

    # confirm the value is the correct type. - in a production system we would want distinct errors to track issues faster
    if not isinstance(message, str) or not isinstance(rating, int):
        return jsonify(
            {"error": "Invalid data type on either 'message' or 'rating'"}
        ), 400

    # TODO: add try so we can catch failures and add a 500
    cursor.execute(
        "INSERT INTO feedback (message, rating, created_at) VALUES (?, ?, ?)",
        (message, rating, created_at),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    check_and_init_db()
    app.run(debug=True)
