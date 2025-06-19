// App.jsx - Mock React frontend (with issues)
import React, { useState, useEffect } from "react";
import { format } from "date-fns";

function App() {
  const [feedback, setFeedback] = useState([]);

  // Filters - default to nothing 
  const [rating, setRating] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState('created_at');

  // Sorting - default to descending
  const [sortOrder, setSortOrder] = useState("desc");

  // New Record Defaults
  const [newMessage, setNewMessage] = useState("");
  const [newRating, setNewRating] = useState("5");
  const [newDate, setNewDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  // Start with the Add Feedback controls hidden
  const [showForm, setShowForm] = useState(false);

  const loadFeedback = () => {
    // Build url request string to query the back end
    const params = new URLSearchParams();
    if (rating && rating !== "") params.append("rating", rating);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append("sort", sortOrder);

    // Call the backend
    fetch(`/feedback?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setFeedback(data))
      .catch(console.error);
  };

  // Ensure that all the correct actions cause the list to reload
  useEffect(loadFeedback, [rating, from, to, sortOrder, sortBy]);

  const addFeedback = () => {
    // Basic client‑side validation that the message isn't blank
    if (!newMessage.trim()) {
      alert("Please enter a message.");
      return;
    }

    // Post new feedback to the back end
    fetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: newMessage.trim(),
        rating: Number(newRating),
        created_at: newDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add feedback");
        // Clear the form and reload list
        setNewMessage("");
        setNewRating("5");
        setNewDate(format(new Date(), "yyyy-MM-dd"));
        loadFeedback();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div>
      <h1>Feedback Dashboard</h1>

      {/* FILTERS */}
      <label>
        Rating:&nbsp;
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">All</option>
          <option value="5">★★★★★</option>
          <option value="4">★★★★</option>
          <option value="3">★★★</option>
          <option value="2">★★</option>
          <option value="1">★</option>
        </select>
      </label>
      <label style={{ marginLeft: 16 }}>
        From:&nbsp;
        <input
          type="date"
          value={from || ""}
          onChange={(e) => setFrom(e.target.value.trim())}
        />
      </label>
      <label style={{ marginLeft: 8 }}>
        To:&nbsp;
        <input
          type="date"
          value={to || ""}
          onChange={(e) => setTo(e.target.value.trim())}
        />
      </label>

      <label style={{ marginLeft: 16 }}>
        Sort By:&nbsp;
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="created_at">Date</option>
          <option value="rating">Stars</option>
        </select>
      </label>

      <label style={{ marginLeft: 8 }}>
        Order:&nbsp;
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="desc">{sortBy === 'rating' ? 'High to Low' : 'Newest First'}</option>
          <option value="asc">{sortBy === 'rating' ? 'Low to High' : 'Oldest First'}</option>
        </select>
      </label>
      {/* LIST */}
      <ul style={{ marginTop: 24 }}>
        {feedback.map((f) => (
          <li key={f.id}>
            {"★".repeat(f.rating)} {f.message} (
            {new Date(f.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
            })}
            )
          </li>
        ))}
      </ul>

      {/* NEW MESSAGE */}
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Hide" : "Add Feedback"}
      </button>

      {showForm && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: 480,
            marginTop: 16,
          }}
        >
          <h2>Add Feedback</h2>
          <textarea
            rows={3}
            placeholder="Your feedback..."
            value={newMessage || ""}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <label>
            Rating:&nbsp;
            <select
              value={newRating || "5"}
              onChange={(e) => setNewRating(e.target.value)}
            >
              <option value="5">★★★★★</option>
              <option value="4">★★★★</option>
              <option value="3">★★★</option>
              <option value="2">★★</option>
              <option value="1">★</option>
            </select>
          </label>
          <label>
            Date:&nbsp;
            <input
              type="date"
              value={newDate || format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </label>
          <button onClick={addFeedback}>Submit Feedback</button>
        </div>
      )}
    </div>
  );
}

export default App;
