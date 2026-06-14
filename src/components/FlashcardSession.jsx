import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FlashcardCard from './FlashcardCard.jsx';
import { API_BASE } from '../App.jsx';
import '../styles/FlashcardSession.css';

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'];

export default function FlashcardSession() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { topic, difficulty: initialDifficulty, count } = state || {};

  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mastered, setMastered] = useState([]);
  const [stillLearning, setStillLearning] = useState([]);
  const [difficulty, setDifficulty] = useState(initialDifficulty || 'beginner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionDone, setSessionDone] = useState(false);
  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!topic) { navigate('/flashcards'); return; }
    loadCards(difficulty);
  }, []);

  async function loadCards(diff) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty: diff, count })
      });
      if (!res.ok) throw new Error('Failed to generate flashcards');
      const data = await res.json();
      setCards(data.flashcards);
      setCurrentIdx(0);
      setMastered([]);
      setStillLearning([]);
      setSessionDone(false);
    } catch (err) {
      setError('Could not generate flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGotIt() {
    const card = cards[currentIdx];
    setMastered(m => [...m, card]);
    advance();
  }

  function handleStillLearning() {
    const card = cards[currentIdx];
    setStillLearning(s => [...s, card]);
    advance();
  }

  function advance() {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      finishSession();
    }
  }

  async function finishSession() {
    setSessionDone(true);
    const userId = localStorage.getItem('brainfuel-user-id');
    if (userId) {
      fetch(`${API_BASE}/ai/flashcards/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, topic, difficulty, mastered: mastered.length + 1, total: cards.length })
      }).catch(() => {});
    }
  }

  function handleNextRound() {
    // Auto-promote difficulty if mastery > 70%
    const masteredCount = mastered.length + 1;
    const masteryRate = masteredCount / cards.length;
    let nextDiff = difficulty;
    if (masteryRate >= 0.7) {
      const nextIdx = DIFFICULTY_ORDER.indexOf(difficulty) + 1;
      if (nextIdx < DIFFICULTY_ORDER.length) nextDiff = DIFFICULTY_ORDER[nextIdx];
    }
    setDifficulty(nextDiff);
    setRound(r => r + 1);
    loadCards(nextDiff);
  }

  if (!topic) return null;

  if (loading) {
    return (
      <div className="fc-session-wrap">
        <div className="fc-loading">
          <div className="fc-spinner" />
          <p>Claude is generating your {difficulty} flashcards on <strong>{topic}</strong>...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fc-session-wrap">
        <div className="fc-error">
          <p>{error}</p>
          <button onClick={() => loadCards(difficulty)}>Try Again</button>
          <button onClick={() => navigate('/flashcards')}>Back</button>
        </div>
      </div>
    );
  }

  if (sessionDone) {
    const masteredCount = mastered.length + (cards.length > 0 ? 1 : 0);
    const masteryRate = Math.round((masteredCount / cards.length) * 100);
    const nextDiffIdx = DIFFICULTY_ORDER.indexOf(difficulty) + 1;
    const canPromote = masteryRate >= 70 && nextDiffIdx < DIFFICULTY_ORDER.length;

    return (
      <div className="fc-session-wrap">
        <div className="fc-summary">
          <h2>Round {round} Complete!</h2>
          <div className="fc-summary-stats">
            <div className="fc-stat-box green">
              <span className="fc-stat-num">{masteredCount}</span>
              <span className="fc-stat-label">Got It</span>
            </div>
            <div className="fc-stat-box orange">
              <span className="fc-stat-num">{cards.length - masteredCount}</span>
              <span className="fc-stat-label">Still Learning</span>
            </div>
            <div className="fc-stat-box blue">
              <span className="fc-stat-num">{masteryRate}%</span>
              <span className="fc-stat-label">Mastery</span>
            </div>
          </div>
          {canPromote && (
            <p className="fc-promote-msg">
              Great job! Next round will be <strong>{DIFFICULTY_ORDER[nextDiffIdx]}</strong> difficulty.
            </p>
          )}
          <div className="fc-summary-actions">
            <button className="fc-start-btn" onClick={handleNextRound}>
              {canPromote ? `Next Round (${DIFFICULTY_ORDER[nextDiffIdx]})` : 'Study Again'}
            </button>
            <button className="fc-outline-btn" onClick={() => navigate('/flashcards')}>
              New Topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = cards[currentIdx];

  return (
    <div className="fc-session-wrap">
      <div className="fc-session-header">
        <div>
          <h2>{topic}</h2>
          <span className={`fc-badge fc-badge-${difficulty}`}>{difficulty}</span>
          {round > 1 && <span className="fc-round-badge">Round {round}</span>}
        </div>
        <div className="fc-progress-text">{currentIdx + 1} / {cards.length}</div>
      </div>

      <div className="fc-progress-bar-wrap">
        <div className="fc-progress-bar" style={{ width: `${((currentIdx) / cards.length) * 100}%` }} />
      </div>

      <div className="fc-mini-stats">
        <span className="got-it-count">Got it: {mastered.length}</span>
        <span className="learning-count">Still learning: {stillLearning.length}</span>
      </div>

      <FlashcardCard
        key={currentIdx}
        card={current}
        onGotIt={handleGotIt}
        onStillLearning={handleStillLearning}
      />
    </div>
  );
}
