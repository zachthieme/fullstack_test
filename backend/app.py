
# app.py - Mock Flask backend (with bugs)
from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route("/feedback", methods=["GET"])
def get_feedback():
    conn = sqlite3.connect('feedback.db')
    cursor = conn.cursor()
    rating = request.args.get("rating")
    sort = request.args.get("sort", "desc")
    query = "SELECT * FROM feedback"
    if rating:
        query += f" WHERE rating = {rating}"  # <-- SQL injection risk
    query += f" ORDER BY created_at {sort}"
    feedback = cursor.execute(query).fetchall()
    conn.close()
    return jsonify(feedback)

@app.route("/feedback", methods=["POST"])
def post_feedback():
    data = request.get_json()
    conn = sqlite3.connect('feedback.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO feedback (message, rating) VALUES (?, ?)", (data["message"], data["rating"]))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})
