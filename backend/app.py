# app.py - Mock Flask backend (with bugs)
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timezone


app = Flask(__name__)
CORS(app)


@app.route("/feedback", methods=["GET"])
def get_feedback():
    conn = sqlite3.connect("feedback.db")
    cursor = conn.cursor()

    rating = request.args.get("rating", type=int)
    sort = request.args.get("sort", "desc").lower()

    if sort not in ["asc", "desc"]:
        sort = "desc"

    query = (
        "SELECT * FROM feedback"  # adding params to remove potential for sql injection
    )
    params = []

    if rating is not None:
        query += " WHERE rating = ?"
        params.append(rating)

    query += f" ORDER BY created_at {sort}"  # leaving as f-string i've ensured that it can only be asc/desc and can use params as asc/desc are keywords
    # TODO: add try so we can catch failures and add a 500
    cursor.execute(query, params)
    rows = cursor.fetchall()

    keys = ["id", "message", "rating", "created_at"]
    json_data = [dict(zip(keys, row)) for row in rows]

    # print(json.dumps(json_data))
    conn.close()
    return json_data  # jsonify(feedback)


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
    app.run(debug=True)
