import pytest
import json
import os
import tempfile
from app import app, check_and_init_db
import sqlite3
from datetime import datetime


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    # Create a temporary database file
    db_fd, app.config["DATABASE"] = tempfile.mkstemp()
    app.config["TESTING"] = True

    with app.test_client() as client:
        with app.app_context():
            # Use a temporary database for testing
            test_db = "test_feedback.db"
            if os.path.exists(test_db):
                os.remove(test_db)

            # Monkey patch the database connection to use test database
            original_connect = sqlite3.connect

            def test_connect(db_name):
                if db_name == "feedback.db":
                    return original_connect(test_db)
                return original_connect(db_name)

            sqlite3.connect = test_connect
            check_and_init_db()

        yield client

    # Clean up
    os.close(db_fd)
    if os.path.exists("test_feedback.db"):
        os.remove("test_feedback.db")
    sqlite3.connect = original_connect


@pytest.fixture
def sample_feedback():
    """Sample feedback data for testing."""
    return [
        {"message": "Great service!", "rating": 5, "created_at": "2024-01-15"},
        {"message": "Could be better", "rating": 3, "created_at": "2024-01-16"},
        {"message": "Excellent experience", "rating": 5, "created_at": "2024-01-17"},
        {"message": "Poor quality", "rating": 2, "created_at": "2024-01-18"},
    ]


def insert_sample_data(sample_feedback):
    """Helper function to insert sample data into test database."""
    conn = sqlite3.connect("test_feedback.db")
    cursor = conn.cursor()

    for feedback in sample_feedback:
        cursor.execute(
            "INSERT INTO feedback (message, rating, created_at) VALUES (?, ?, ?)",
            (feedback["message"], feedback["rating"], feedback["created_at"]),
        )

    conn.commit()
    conn.close()


class TestGetFeedback:
    """Tests for GET /feedback endpoint."""

    def test_get_empty_feedback(self, client):
        """Test getting feedback when database is empty."""
        response = client.get("/feedback")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_get_all_feedback(self, client, sample_feedback):
        """Test getting all feedback without filters."""
        insert_sample_data(sample_feedback)

        response = client.get("/feedback")
        assert response.status_code == 200

        data = response.get_json()
        assert len(data) == 4

        # Check that all required fields are present
        for item in data:
            assert "id" in item
            assert "message" in item
            assert "rating" in item
            assert "created_at" in item

    def test_get_feedback_with_rating_filter(self, client, sample_feedback):
        """Test filtering feedback by rating."""
        insert_sample_data(sample_feedback)

        response = client.get("/feedback?rating=5")
        assert response.status_code == 200

        data = response.get_json()
        assert len(data) == 2

        for item in data:
            assert item["rating"] == 5

    def test_get_feedback_with_date_filter(self, client, sample_feedback):
        """Test filtering feedback by date range."""
        insert_sample_data(sample_feedback)

        # Test from date filter
        response = client.get("/feedback?from=2024-01-16")
        assert response.status_code == 200

        data = response.get_json()
        assert len(data) == 3

        # Test to date filter
        response = client.get("/feedback?to=2024-01-16")
        assert response.status_code == 200

        data = response.get_json()
        assert len(data) == 2

        # Test date range filter
        response = client.get("/feedback?from=2024-01-16&to=2024-01-17")
        assert response.status_code == 200

        data = response.get_json()
        assert len(data) == 2

    def test_get_feedback_with_sort_order(self, client, sample_feedback):
        """Test sorting feedback by date."""
        insert_sample_data(sample_feedback)

        # Test descending order (default)
        response = client.get("/feedback?sort=desc")
        assert response.status_code == 200

        data = response.get_json()
        dates = [item["created_at"] for item in data]
        assert dates == sorted(dates, reverse=True)

        # Test ascending order
        response = client.get("/feedback?sort=asc")
        assert response.status_code == 200

        data = response.get_json()
        dates = [item["created_at"] for item in data]
        assert dates == sorted(dates)

    def test_get_feedback_invalid_date_format(self, client):
        """Test invalid date format returns 400 error."""
        response = client.get("/feedback?from=invalid-date")
        assert response.status_code == 400

        response = client.get("/feedback?to=2024-13-45")
        assert response.status_code == 400

    def test_get_feedback_invalid_sort_parameter(self, client, sample_feedback):
        """Test invalid sort parameter defaults to desc."""
        insert_sample_data(sample_feedback)

        response = client.get("/feedback?sort=invalid")
        assert response.status_code == 200

        data = response.get_json()
        # Should default to desc order
        dates = [item["created_at"] for item in data]
        assert dates == sorted(dates, reverse=True)


class TestPostFeedback:
    """Tests for POST /feedback endpoint."""

    def test_post_valid_feedback(self, client):
        """Test posting valid feedback."""
        feedback_data = {
            "message": "Test feedback",
            "rating": 4,
            "created_at": "2024-01-20",
        }

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 200
        assert response.get_json() == {"status": "ok"}

        # Verify the feedback was actually saved
        get_response = client.get("/feedback")
        data = get_response.get_json()
        assert len(data) == 1
        assert data[0]["message"] == "Test feedback"
        assert data[0]["rating"] == 4
        assert data[0]["created_at"] == "2024-01-20"

    def test_post_feedback_without_date(self, client):
        """Test posting feedback without created_at (should use current date)."""
        feedback_data = {"message": "Test feedback without date", "rating": 3}

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 200

        # Verify the feedback was saved with current date
        get_response = client.get("/feedback")
        data = get_response.get_json()
        assert len(data) == 1
        assert data[0]["message"] == "Test feedback without date"
        assert data[0]["rating"] == 3
        # Check that created_at is today's date
        today = datetime.now().strftime("%Y-%m-%d")
        assert data[0]["created_at"] == today

    def test_post_feedback_missing_message(self, client):
        """Test posting feedback without message returns 400."""
        feedback_data = {"rating": 4}

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 400
        assert "Missing 'message' or 'rating'" in response.get_json()["error"]

    def test_post_feedback_missing_rating(self, client):
        """Test posting feedback without rating returns 400."""
        feedback_data = {"message": "Test message"}

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 400
        assert "Missing 'message' or 'rating'" in response.get_json()["error"]

    def test_post_feedback_invalid_message_type(self, client):
        """Test posting feedback with non-string message returns 400."""
        feedback_data = {
            "message": 123,  # Should be string
            "rating": 4,
        }

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 400
        assert "Invalid data type" in response.get_json()["error"]

    def test_post_feedback_invalid_rating_type(self, client):
        """Test posting feedback with non-integer rating returns 400."""
        feedback_data = {
            "message": "Test message",
            "rating": "not_a_number",  # Should be integer
        }

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 400
        assert "Invalid data type" in response.get_json()["error"]

    def test_post_feedback_no_json_data(self, client):
        """Test posting feedback without JSON data."""
        response = client.post("/feedback")

        # This should cause an error when trying to get JSON data
        # 415 = Unsupported Media Type (Flask returns this for missing Content-Type)
        assert response.status_code in [400, 415, 500]

    def test_post_feedback_empty_json(self, client):
        """Test posting empty JSON data."""
        response = client.post(
            "/feedback", data=json.dumps({}), content_type="application/json"
        )

        assert response.status_code == 400
        assert "Missing 'message' or 'rating'" in response.get_json()["error"]


class TestDatabaseOperations:
    """Tests for database initialization and operations."""

    def test_database_initialization(self):
        """Test that database and table are created properly."""
        # Remove test database if it exists
        test_db = "test_init.db"
        if os.path.exists(test_db):
            os.remove(test_db)

        # Monkey patch to use test database
        original_connect = sqlite3.connect

        def test_connect(db_name):
            if db_name == "feedback.db":
                return original_connect(test_db)
            return original_connect(db_name)

        sqlite3.connect = test_connect

        try:
            check_and_init_db()

            # Verify database was created
            assert os.path.exists(test_db)

            # Verify table structure
            conn = sqlite3.connect(test_db)
            cursor = conn.cursor()

            cursor.execute("PRAGMA table_info(feedback)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            assert "id" in column_names
            assert "message" in column_names
            assert "rating" in column_names
            assert "created_at" in column_names

            conn.close()

        finally:
            sqlite3.connect = original_connect
            if os.path.exists(test_db):
                os.remove(test_db)


class TestCORSAndHeaders:
    """Tests for CORS and HTTP headers."""

    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses."""
        response = client.get("/feedback")

        # Check that CORS headers are present
        assert "Access-Control-Allow-Origin" in response.headers

    def test_options_request(self, client):
        """Test OPTIONS request for preflight CORS."""
        response = client.options("/feedback")

        # Should return 200 for preflight requests
        assert response.status_code == 200


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_very_long_message(self, client):
        """Test posting feedback with very long message."""
        long_message = "x" * 10000  # Very long message

        feedback_data = {"message": long_message, "rating": 5}

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        # Should still work (SQLite TEXT can handle large strings)
        assert response.status_code == 200

    def test_rating_boundary_values(self, client):
        """Test posting feedback with boundary rating values."""
        # Test with very low rating
        feedback_data = {"message": "Terrible", "rating": -100}

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 400

        # Test with very high rating
        feedback_data = {"message": "Amazing", "rating": 1000}

        response = client.post(
            "/feedback", data=json.dumps(feedback_data), content_type="application/json"
        )

        assert response.status_code == 400

