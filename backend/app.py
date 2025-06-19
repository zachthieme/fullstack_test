# app.py - Mock Flask backend (with bugs)
import sqlite3
import os
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from datetime import datetime, timezone
from dateutil import parser


def check_and_init_db():
    db_path = "feedback.db"
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at TEXT NOT NULL
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

    sort_by = request.args.get("sortBy", "created_at")
    sort_order = request.args.get("sort", "desc").lower()

    valid_sort_fields = ["created_at", "rating"]

    # set defaults for valid sort fields/order in case someone tries to modify url string
    if sort_by not in valid_sort_fields:
        sort_by = "created_at"

    if sort_order not in ["asc", "desc"]:
        sort_order = "desc"

    # use where 1=1 so that i can make the filters easy to add to the query
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

    query += f" ORDER BY {sort_by} {sort_order}"

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
    created_at = data.get("created_at")

    # confirm that there is a value provided - in a production system we would want distinct errors to track issues faster
    if message is None or rating is None:
        return jsonify({"error": "Missing 'message' or 'rating'"}), 400

    # confirm the value is the correct type. - in a production system we would want distinct errors to track issues faster
    if not isinstance(message, str) or not isinstance(rating, int):
        return jsonify(
            {"error": "Invalid data type on either 'message' or 'rating'"}
        ), 400

    # ensure that  the rating is in the proper range
    if not (1 <= rating <= 5):
        return jsonify({"error": "Rating on in range 1 - 5"}), 400

    try:
        if created_at:
            # Parse assumed local time and convert to UTC
            local_dt = parser.parse(created_at)
            utc_dt = local_dt.astimezone(timezone.utc)
        else:
            utc_dt = datetime.now(timezone.utc)

        created_at_utc_str = utc_dt.isoformat()
    except Exception as e:
        return jsonify({"error": f"Invalid date format: {e}"}), 400

    cursor.execute(
        "INSERT INTO feedback (message, rating, created_at) VALUES (?, ?, ?)",
        (message, rating, created_at_utc_str),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # Create the DB if it doesn't exist
    check_and_init_db()
    app.run()
