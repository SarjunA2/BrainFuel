import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../App.jsx';
import '../styles/Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const userId = localStorage.getItem('brainfuel-user-id');
    if (!userId) return;
    fetch(`${API_BASE}/stats/streak?userId=${userId}`)
      .then(r => r.json())
      .then(d => setStreak(d.currentStreak || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="landing">
      <div className="landing-hero">
        {streak > 0 && (
          <div className="streak-badge">
            <span>🔥</span>
            <span>{streak} day streak</span>
          </div>
        )}
        <h1>BrainFuel</h1>
        <p className="landing-subtitle">Learn anything. Quiz yourself. Get smarter every day.</p>
      </div>

      <div className="landing-cards">
        <div className="mode-card" onClick={() => navigate('/quiz')}>
          <div className="mode-card-icon">🎯</div>
          <h3>Quiz Mode</h3>
          <p>Classic trivia or AI-generated questions on any topic.</p>
          <button>Start Quiz</button>
        </div>

        <div className="mode-card featured" onClick={() => navigate('/flashcards')}>
          <div className="mode-card-icon">🃏</div>
          <h3>AI Flashcards</h3>
          <p>Learn any subject with adaptive flashcards powered by Claude.</p>
          <button>Study Now</button>
        </div>

        <div className="mode-card" onClick={() => navigate('/stats')}>
          <div className="mode-card-icon">📊</div>
          <h3>My Stats</h3>
          <p>Track your streaks, accuracy, and best categories.</p>
          <button>View Stats</button>
        </div>
      </div>
    </div>
  );
}
