import { useEffect, useState } from 'react';
import './HelpPopup.css';

export default function HelpPopup({ onClose }) {
  const [content, setContent] = useState('');
  const [Markdown, setMarkdown] = useState(null);

  useEffect(() => {
    fetch('/USER_MANUAL.md')
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent('Failed to load manual.'));

    import('react-markdown')
      .then((mod) => setMarkdown(() => mod.default))
      .catch(() => setMarkdown(null));
  }, []);

  return (
    <div className="help-overlay">
      <div className="help-container">
        <button className="help-close" onClick={onClose}>
          &times;
        </button>
        <div className="help-content">
          {Markdown ? <Markdown>{content}</Markdown> : <pre>{content}</pre>}
        </div>
      </div>
    </div>
  );
}
