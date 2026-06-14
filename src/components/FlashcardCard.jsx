import React, { useState } from 'react';
import '../styles/FlashcardCard.css';

export default function FlashcardCard({ card, onGotIt, onStillLearning }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => setFlipped(f => !f);

  return (
    <div className="fc-card-scene" onClick={handleFlip}>
      <div className={`fc-card ${flipped ? 'is-flipped' : ''}`}>
        <div className="fc-card-face fc-card-front">
          <span className="fc-card-label">Question</span>
          <p>{card.question}</p>
          <span className="fc-tap-hint">Tap to reveal answer</span>
        </div>
        <div className="fc-card-face fc-card-back">
          <span className="fc-card-label">Answer</span>
          <p>{card.answer}</p>
          {flipped && (
            <div className="fc-card-actions" onClick={e => e.stopPropagation()}>
              <button className="fc-btn-learning" onClick={onStillLearning}>Still Learning</button>
              <button className="fc-btn-gotit" onClick={onGotIt}>Got It!</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
