import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing.jsx';
import Trivia from './components/Trivia.jsx';
import Stats from './components/Stats.jsx';
import FlashcardLanding from './components/FlashcardLanding.jsx';
import FlashcardSession from './components/FlashcardSession.jsx';
import NavBar from './components/NavBar.jsx';
import './styles/global.css';

export const API_BASE = import.meta.env.PROD
  ? 'https://brainfuel.onrender.com'
  : '';

function App() {
  useEffect(() => {
    let userId = localStorage.getItem('brainfuel-user-id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('brainfuel-user-id', userId);
    }
    // Touch streak on app open
    fetch(`${API_BASE}/stats/streak/touch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quiz" element={<Trivia />} />
        <Route path="/flashcards" element={<FlashcardLanding />} />
        <Route path="/flashcards/session" element={<FlashcardSession />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
