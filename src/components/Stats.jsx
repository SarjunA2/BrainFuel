import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

import '../styles/Stats.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Stats({ onBack }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/stats/summary')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Error fetching stats:', err));
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  const labels = Object.keys(stats.categoryStats);
  const correctData = labels.map((cat) => stats.categoryStats[cat].correct);
  const totalData = labels.map((cat) => stats.categoryStats[cat].total);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Correct Answers',
        data: correctData,
        backgroundColor: '#34d399'
      },
      {
        label: 'Total Answers',
        data: totalData,
        backgroundColor: '#93c5fd'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  return (
    <div className="stats-container">
      <h2>Your Stats</h2>
      <p>Longest Streak: {stats.longestStreak}</p>
      <p>
        Correct: {stats.correctAnswers} / {stats.totalAnswered}
      </p>
      <div className="chart-wrapper">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <p className="best-category">Best Category: <strong>{stats.bestCategory}</strong></p>
      <button onClick={onBack}>← Back to Home</button>
    </div>
  );
}
