import { useEffect, useState } from 'react';

const stages = [
  { key: 'observe', title: 'Observe', detail: 'Ingress telemetry and threat vectors are collected.' },
  { key: 'evaluate', title: 'Evaluate', detail: 'The policy engine ranks pathways by expected reward.' },
  { key: 'exploit', title: 'Exploit', detail: 'The selected vector is prepared for controlled testing.' },
  { key: 'report', title: 'Report', detail: 'Results and mitigation guidance are distilled for operators.' }
];

export default function SimulationPage({ token }) {
  const [activeStage, setActiveStage] = useState('observe');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
      setActiveStage((prev) => {
        const currentIndex = stages.findIndex((stage) => stage.key === prev);
        return stages[(currentIndex + 1) % stages.length].key;
      });
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-card">
      <div className="eyebrow">Autonomous Loop</div>
      <h2>RL Attack Simulation</h2>
      <p>Observe the decision engine as it explores attack paths, learns from outcomes, and prioritizes promising signals.</p>
      <p className="status-text" style={{ marginTop: '8px' }}>
        {token ? 'Authenticated operator session active.' : 'Running in guest mode.'}
      </p>

      <div className="sim-grid" style={{ marginTop: '16px' }}>
        <div className="sim-loop-panel">
          <div className="sim-loop-header">
            <span>Decision Loop</span>
            <strong>Cycle {tick + 1}</strong>
          </div>
          <div className="sim-stage-list">
            {stages.map((stage) => (
              <button
                key={stage.key}
                className={`sim-stage-card ${activeStage === stage.key ? 'active' : ''}`}
                onClick={() => setActiveStage(stage.key)}
              >
                <span>{stage.title}</span>
                <small>{stage.detail}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="feature-card sim-signal-card">
          <div className="sim-signal-header">
            <h3>Current Signal</h3>
            <span className="sim-pill">Live</span>
          </div>
          <p>Loop cycle #{tick + 1} · {stages.find((stage) => stage.key === activeStage)?.title} phase engaged.</p>
          <p>The policy engine is updating its next best action based on the latest reward signal.</p>
          <div className="sim-metrics">
            <div>
              <strong>Reward</strong>
              <span>+0.84</span>
            </div>
            <div>
              <strong>Confidence</strong>
              <span>92%</span>
            </div>
            <div>
              <strong>Latency</strong>
              <span>14ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
