import { useState } from 'react';

const initialTargets = [
  { name: 'Gateway Node', service: 'SSH', port: '22/tcp', risk: 'Low', detail: 'TLS banner exposed with weak cipher preference.' },
  { name: 'Public Web', service: 'HTTP', port: '80/tcp', risk: 'Medium', detail: 'Security headers partially missing.' },
  { name: 'Admin Panel', service: 'HTTPS', port: '443/tcp', risk: 'High', detail: 'Credential stuffing protections require review.' }
];

export default function ScannerPage({ token }) {
  const [targets, setTargets] = useState(initialTargets);
  const [running, setRunning] = useState(false);

  const runScan = () => {
    setRunning(true);
    setTimeout(() => {
      setTargets((prev) =>
        prev.map((target, index) => ({
          ...target,
          risk: index === 2 ? 'Critical' : target.risk,
          detail: index === 2 ? 'Observed repeated auth failures and weak MFA posture.' : target.detail
        }))
      );
      setRunning(false);
    }, 900);
  };

  return (
    <div className="page-card">
      <div className="eyebrow">Mission Control</div>
      <h2>Network & Vulnerability Intelligence</h2>
      <p>Monitor live targets, scan services, and track high-value exposure points across the environment.</p>
      <p className="status-text" style={{ marginTop: '8px' }}>
        {token ? 'Authenticated operator session active.' : 'Running in guest mode.'}
      </p>

      <div className="panel-header" style={{ marginTop: '20px' }}>
        <div>
          <div className="eyebrow">Sweep Status</div>
          <h3>{running ? 'Scanning active assets…' : 'Ready for a fresh sweep'}</h3>
        </div>
        <button className="generate-btn" onClick={runScan} disabled={running}>
          {running ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      <div className="feature-grid" style={{ marginTop: '16px' }}>
        {targets.map((target) => (
          <div key={target.name} className="feature-card">
            <h3>{target.name}</h3>
            <p>{target.service} · {target.port}</p>
            <p>Risk: {target.risk}</p>
            <p>{target.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
