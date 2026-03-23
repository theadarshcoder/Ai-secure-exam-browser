import React from 'react';
import './ExamCockpit.css';

// Mock data for demonstration
const mockQuestion = {
  id: 1,
  text: "Which of the following best describes the principle of least privilege?",
  options: [
    "Granting users full access to all resources",
    "Providing the minimum level of access required",
    "Allowing administrators to override permissions",
    "Disabling all user permissions"
  ]
};

export default function ExamCockpit() {
  const [selected, setSelected] = React.useState(null);
  const [activeQuestion, setActiveQuestion] = React.useState(1);
  const [answered, setAnswered] = React.useState([]);

  const handleSelect = (index) => {
    setSelected(index);
    setAnswered((prev) => [...new Set([...prev, activeQuestion])]);
  };

  return (
    <div className="exam-cockpit-root">
      {/* Header */}
      <header className="exam-header">
        <div className="timer">00:45:00</div>
      </header>

      {/* Main Layout */}
      <div className="exam-layout">
        {/* Left Sidebar */}
        <aside className="sidebar-left">
          <div className="question-grid">
            {Array.from({ length: 20 }, (_, i) => {
              const qNum = i + 1;
              const isActive = qNum === activeQuestion;
              const isAnswered = answered.includes(qNum);
              const stateClass = isActive
                ? 'active'
                : isAnswered
                ? 'answered'
                : 'not-visited';
              return (
                <button
                  key={qNum}
                  className={`question-btn ${stateClass}`}
                  onClick={() => setActiveQuestion(qNum)}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Panel */}
        <main className="center-panel">
          <div className="question-card">
            <h2 className="question-text">{mockQuestion.text}</h2>
            <div className="options-grid">
              {mockQuestion.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`option-tile ${selected === idx ? 'selected' : ''}`}
                  onClick={() => handleSelect(idx)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar-right">
          <div className="webcam-feed">
            <video autoPlay muted playsInline />
            <div className="pulse-ring" />
          </div>
          <div className="biometric-bar">
            <label>Biometric Confidence</label>
            <progress max="100" value="0" />
          </div>
          <pre className="ai-terminal">
            {Array.from({ length: 10 }, (_, i) => `> AI Sentinel: monitoring... ${i}`).join('\n')}
          </pre>
        </aside>
      </div>

      {/* Footer */}
      <footer className="exam-footer">
        <button className="btn ghost">Mark for Review</button>
        <button className="btn primary">Save &amp; Next</button>
      </footer>
    </div>
  );
}
