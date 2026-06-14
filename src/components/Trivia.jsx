import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../App.jsx';
import '../styles/Trivia.css';

function decodeHTML(text) {
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
}

function shuffle(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

const CATEGORY_OPTIONS = [
  { id: '9',  label: 'General Knowledge' },
  { id: '21', label: 'Sports' },
  { id: '23', label: 'History' },
  { id: '17', label: 'Science & Nature' },
  { id: '18', label: 'Computers' },
  { id: '22', label: 'Geography' },
];

export default function Trivia() {
  const navigate = useNavigate();
  const location = useLocation();

  // Support being launched with pre-generated AI questions via router state
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Setup state (shown when no questions loaded yet)
  const [category, setCategory] = useState('9');
  const [customTopic, setCustomTopic] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('brainfuel-user-id');
  const currentQ = questions[currentIdx];

  async function fetchOpenTDBQuestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://opentdb.com/api.php?amount=5&type=multiple&category=${category}`);
      const data = await res.json();
      if (!data.results?.length) throw new Error('No questions returned');
      const qs = data.results.map(q => ({
        question: decodeHTML(q.question),
        correct_answer: decodeHTML(q.correct_answer),
        allAnswers: shuffle([q.correct_answer, ...q.incorrect_answers].map(decodeHTML)),
        category: decodeHTML(q.category)
      }));
      setQuestions(qs);
      setCurrentIdx(0);
    } catch {
      setError('Could not load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAIQuestions() {
    if (!customTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customTopic.trim() })
      });
      if (!res.ok) throw new Error('AI quiz failed');
      const data = await res.json();
      setQuestions(data.questions);
      setCurrentIdx(0);
    } catch {
      setError('Could not generate AI quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected || !currentQ) return;
    setSubmitted(true);

    const isCorrect = selected === currentQ.correct_answer;

    // Record answer
    fetch(`${API_BASE}/stats/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        category: currentQ.category || 'General',
        correct: isCorrect,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {});

    // Fetch AI explanation
    setLoadingExplain(true);
    try {
      const res = await fetch(`${API_BASE}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          correctAnswer: currentQ.correct_answer,
          userAnswer: selected,
          wasCorrect: isCorrect
        })
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data.explanation);
      }
    } catch {
      // explanation is optional — fail silently
    } finally {
      setLoadingExplain(false);
    }
  }

  function handleNext() {
    setSelected('');
    setSubmitted(false);
    setExplanation('');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setQuestions([]);
      setCurrentIdx(0);
    }
  }

  function getChoiceClass(option) {
    if (!submitted) return 'choice';
    if (option === currentQ.correct_answer) return 'choice correct';
    if (option === selected) return 'choice wrong';
    return 'choice';
  }

  // Setup screen
  if (!questions.length) {
    return (
      <div className="trivia-setup">
        <h1>Quiz Mode</h1>
        <div className="quiz-mode-toggle">
          <button className={!useAI ? 'active' : ''} onClick={() => setUseAI(false)}>Classic Categories</button>
          <button className={useAI ? 'active' : ''} onClick={() => setUseAI(true)}>AI Custom Topic</button>
        </div>

        {!useAI ? (
          <div className="quiz-setup-form">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button onClick={fetchOpenTDBQuestions} disabled={loading}>
              {loading ? 'Loading...' : 'Start Quiz'}
            </button>
          </div>
        ) : (
          <div className="quiz-setup-form">
            <label>Any topic you want</label>
            <input
              type="text"
              placeholder="e.g. The Roman Empire, 80s movies, Quantum Physics..."
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchAIQuestions()}
            />
            <button onClick={fetchAIQuestions} disabled={loading || !customTopic.trim()}>
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>
        )}

        {error && <p className="quiz-error">{error}</p>}
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="trivia-container">
      <div className="trivia-meta">
        <span className="trivia-category">{currentQ.category}</span>
        <span className="trivia-counter">{currentIdx + 1} / {questions.length}</span>
      </div>

      <div className="trivia-progress-bar">
        <div style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
      </div>

      <h2>{currentQ.question}</h2>

      <form onSubmit={handleSubmit}>
        {currentQ.allAnswers.map((option, i) => (
          <label key={i} className={getChoiceClass(option)}>
            <input
              type="radio"
              name="answer"
              value={option}
              onChange={() => setSelected(option)}
              checked={selected === option}
              disabled={submitted}
            />
            <span>{option}</span>
          </label>
        ))}

        {!submitted ? (
          <button type="submit" disabled={!selected}>Submit Answer</button>
        ) : (
          <div className="post-answer">
            {loadingExplain && <p className="explanation loading">Getting explanation...</p>}
            {explanation && (
              <div className="explanation-box">
                <span className="explanation-label">Did you know?</span>
                <p>{explanation}</p>
              </div>
            )}
            <button type="button" onClick={handleNext}>
              {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
