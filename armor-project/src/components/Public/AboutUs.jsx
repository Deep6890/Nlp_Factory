import React from 'react';
import './Public.css';

const AboutUs = () => {
  const team = [
    { name: "Dhairya Patel", role: "Frontend & System" },
    { name: "Krish Parmar", role: "Speech Recognition" },
    { name: "Mayur Maghrola", role: "App Development" },
    { name: "Deep Kayastha", role: "NLP & Model" }
  ];

  return (
    <div className="about-container">
      <div className="page-hero">
        <h1>About Armor.ai</h1>
        <p>Securing financial conversations through on-device intelligence.</p>
      </div>
      <div className="team-grid">
        {team.map(m => (
          <div className="team-card" key={m.name}>
            <div className="avatar-placeholder"></div>
            <h3>{m.name}</h3>
            <p>{m.role}</p>
          </div>
        ))}
      </div>
      <div className="hack-badge">🏆 HACK2FUTURE 2.0 | CHARUSAT UNIVERSITY</div>
    </div>
  );
};

export default AboutUs;