import { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api/client';
import './ConnectionIndicator.css';

export default function ConnectionIndicator() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    console.log(`connecting to ${API_BASE_URL}...`);
    let first = true;
    const check = async () => {
      try {
        await api.ping();
        setOnline(true);
        if (first) console.log('Connected!');
      } catch (_) {
        setOnline(false);
        if (first) console.log('Fail!');
      }
      first = false;
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  return <span className={`connection-indicator ${online ? 'ok' : 'fail'}`} />;
}
