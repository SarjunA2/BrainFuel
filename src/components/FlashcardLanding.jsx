import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FlashcardLanding.css';

const SUGGESTED_TOPICS = [
  'World History', 'Space & Astronomy', 'Ancient Civilizations',
  'Famous Scientists', 'World Capitals', 'Pop Culture', 'Biology', 'Mathematics'
];

export default function FlashcardLanding() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [count, setCount] = useState(8);
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    navigate('/flashcards/session', { state: { topic: topic.trim(), difficulty, count } });
  };

  return (
    <div className="fc-landing">
      <div className="fc-landing-card">
        <h1>AI Flashcards</h1>
        <p className="fc-subtitle">Pick any topic — Claude generates personalized flashcards and adapts to your level.</p>

        <form onSubmit={handleStart} className="fc-form">
          <label>Topic</label>
          <input
            type="text"
            placeholder="e.g. Ancient Rome, Jazz Music, Quantum Physics..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="fc-input"
            autoFocus
          />

          <div className="fc-suggestions">
            {SUGGESTED_TOPICS.map(t => (
              <button
                key={t}
                type="button"
                className={`fc-chip ${topic === t ? 'active' : ''}`}
                onClick={() => setTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label>Starting Difficulty</label>
          <div className="fc-difficulty-row">
            {['beginner', 'intermediate', 'advanced'].map(d => (
              <button
                key={d}
                type="button"
                className={`fc-diff-btn ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          <label>Number of Cards</label>
          <div className="fc-count-row">
            {[6, 8, 10, 15].map(n => (
              <button
                key={n}
                type="button"
                className={`fc-diff-btn ${count === n ? 'active' : ''}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <button type="submit" className="fc-start-btn" disabled={!topic.trim()}>
            Generate Flashcards
          </button>
        </form>
      </div>
    </div>
  );
}
