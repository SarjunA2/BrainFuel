import React, { useState } from 'react';
import '../styles/Trivia.css';

export default function Trivia({ questionData, onNext }) {
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      await fetch('http://localhost:3001/stats/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: questionData.category || "General",  
          correct: selected === questionData.correct,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error("Didnt record answer", err);
    }
  };
  

  const handleNext = () => {
    setSelected('');
    setSubmitted(false);
    onNext();
  };

  const getClassName = (option) => {
    if (!submitted) return 'choice';
    if (option === questionData.correct) return 'choice correct';
    if (option === selected) return 'choice wrong';
    return 'choice';
  };

  return (
    <div className="trivia-container">
      <h2 dangerouslySetInnerHTML={{ __html: questionData.question }} />
      <form onSubmit={handleSubmit}>
        {questionData.choices.map((option, index) => (
          <label key={index} className={getClassName(option)}>
            <input type="radio" name="answer" value={option} onChange={() => setSelected(option)} checked={selected === option} disabled={submitted} required/>
            <span dangerouslySetInnerHTML={{ __html: option }} />
          </label>
        ))}

        {!submitted ? (
          <button type="submit" disabled={!selected}>Submit</button>
        ) : (
          <button type="button" onClick={handleNext}>Next Question</button>
        )}
      </form>
    </div>
  );
}
