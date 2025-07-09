import './ConsolePanel.css';
import { useAppState } from '../context/AppState';

export default function ConsolePanel() {
  const {
    state: { logs },
  } = useAppState();

  return (
    <div className="console-panel">
      {logs.map((log, idx) => (
        <div key={idx} className="console-entry">
          <div className="console-request">
            {log.method} {log.endpoint}
            {log.payload ? (
              <pre>{JSON.stringify(log.payload, null, 2)}</pre>
            ) : null}
          </div>
          <div className="console-response">
            <pre>{JSON.stringify(log.response, null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
