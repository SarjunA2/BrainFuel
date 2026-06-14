import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { API_BASE } from '../App.jsx';
import '../styles/Stats.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('brainfuel-user-id');

  useEffect(() => {
    fetch(`${API_BASE}/stats/summary?userId=${userId}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Could not load stats.'));
  }, []);

  if (error) return (
    <div className="stats-container">
      <p className="stats-error">{error}</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  if (!stats) return (
    <div className="stats-container">
      <div className="stats-loading">
        <div className="stats-spinner" />
        <p>Loading your stats...</p>
      </div>
    </div>
  );

  const labels = Object.keys(stats.categoryStats);
  const correctData = labels.map(c => stats.categoryStats[c].correct);
  const totalData = labels.map(c => stats.categoryStats[c].total);

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100)
    : 0;

  return (
    <div className="stats-container">
      <h2>Your Stats</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🔥</span>
          <span className="stat-value">{stats.dailyStreak ?? 0}</span>
          <span className="stat-label">Day Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <span className="stat-value">{stats.longestStreak}</span>
          <span className="stat-label">Best Answer Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">{stats.totalAnswered}</span>
          <span className="stat-label">Questions Answered</span>
        </div>
      </div>

      {labels.length > 0 && (
        <div className="chart-section">
          <h3>Performance by Category</h3>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels,
                datasets: [
                  { label: 'Correct', data: correctData, backgroundColor: '#34d399' },
                  { label: 'Total', data: totalData, backgroundColor: '#93c5fd' }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
          <p className="best-category">
            Best Category: <strong>{stats.bestCategory}</strong>
          </p>
        </div>
      )}

      {labels.length === 0 && (
        <div className="stats-empty">
          <p>No quiz data yet. Play a round to see your stats!</p>
          <button onClick={() => navigate('/quiz')}>Start a Quiz</button>
        </div>
      )}

      <button className="stats-back-btn" onClick={() => navigate('/')}>← Back to Home</button>
    </div>
  );
}
