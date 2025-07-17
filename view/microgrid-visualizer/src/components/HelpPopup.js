import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './HelpPopup.css';

export default function HelpPopup({ onClose }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/USER_MANUAL.md`)
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent('Failed to load manual.'));
  }, []);

  return (
    <div className="help-overlay">
      <div className="help-container">
        <button className="help-close" onClick={onClose}>
          &times;
        </button>
        <div className="help-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
