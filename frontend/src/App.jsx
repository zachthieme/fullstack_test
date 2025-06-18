
// App.jsx - Mock React frontend (with issues)
import React, { useState, useEffect } from 'react';

function App() {
  const [feedback, setFeedback] = useState([]);
  const [rating, setRating] = useState(null);
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    // Query string with only selected parameters
    const params = new URLSearchParams();
    if (rating) params.append('rating', rating);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (sortOrder) params.append('sort', sortOrder);

    fetch(`/feedback?${params.toString()}`)
      .then(res => res.json())
      .then(data => setFeedback(data))
      .catch(console.error);
  }, [rating, from, to, sortOrder]);

  return (
    <div>
      <label>      <h1>Feedback Dashboard</h1>
        <select onChange={(e) => setRating(e.target.value)}>
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
          type='date'
          value={from}
          onChange={e => setFrom(e.target.value.trim())}
        />
      </label>
      <label style={{ marginLeft: 8 }}>
        To:&nbsp;
        <input
          type='date'
          value={to}
          onChange={e => setTo(e.target.value.trim())}
        />
      </label>
      <label style={{ marginLeft: 16 }}>
        Sort:&nbsp;
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value.trim())}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </label>

      <ul style={{ marginTop: 24 }}>
        {feedback.map(f => (
          <li key={f.id}>
            {'★'.repeat(f.rating)} {f.message}  ({new Date(f.created_at).toLocaleDateString()})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
