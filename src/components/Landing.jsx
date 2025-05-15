import React, { useState } from 'react';

import '../styles/Landing.css';

export default function Landing({onStart, onViewStats}) {
  const [category, setCategory] = useState('9');
  const handleStart = () => {
    onStart(category);
  };

  return (
    <div className="landing">
      <h1>🧠 BrainFuel</h1>
      <p>Start your day with a trivia challenge</p>

      <label>
        Choose Category:
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="9">General Knowledge</option>
          <option value="21">Sports</option>
          <option value="23">History</option>
          <option value="17">Science and Nature</option>
          <option value="18">Computers</option>
          <option value="22">Geography</option>
        </select>
      </label>

      <button onClick={handleStart}>Start Trivia</button>
      <button onClick={onViewStats}>View Stats</button>
    </div>
  );
}
