import { useState, useEffect } from 'react';
import api from '../api/client';
import './ConnectionIndicator.css';

export default function ConnectionIndicator() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await api.ping();
        setOnline(true);
      } catch (_) {
        setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  return <span className={`connection-indicator ${online ? 'ok' : 'fail'}`} />;
}
