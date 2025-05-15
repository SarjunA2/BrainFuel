import React, { useState } from 'react';
import Landing from './components/Landing.jsx';
import Trivia from './components/Trivia.jsx';
import './styles/global.css';
import Stats from './components/Stats.jsx';


function App() {
  const [start, setStart] = useState(false);
  const [questionSet, setQuestionSet] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);

  function decodeHTMLEntities(text) {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }
  

  const fetchQuestions = async (categoryId) => {
    const res = await fetch(`https://opentdb.com/api.php?amount=5&type=multiple&category=${categoryId}`);
    const data = await res.json();
  
    const questions = data.results.map((q) => {
      const allChoices = [...q.incorrect_answers, q.correct_answer].sort(() => 0.5 - Math.random());
      return {
        question: q.question,
        correct: q.correct_answer,
        choices: allChoices,
        category: decodeHTMLEntities(q.category) // 💡 include this!
      };
    });
  
    setQuestionSet(questions);
    setCurrentIndex(0);
    setStart(true);
  };
  

  const nextQuestion = () => {
    if (currentIndex < questionSet.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStart(false); 
    }
  };

  return (
    <>
      {showStats ? (
        <Stats onBack={() => setShowStats(false)} />
      ) : start && questionSet.length > 0 ? (
        <Trivia
          questionData={questionSet[currentIndex]}
          onNext={nextQuestion}
        />
      ) : (
        <Landing
          onStart={fetchQuestions}
          onViewStats={() => setShowStats(true)}
        />
      )}
    </>
  );
}

export default App;
