const timeline = [
  { title: 'Initial triage', detail: 'Assets and attack paths catalogued.' },
  { title: 'Evidence capture', detail: 'Screenshots and logs linked to findings.' },
  { title: 'Remediation review', detail: 'Mitigation owners assigned with deadlines.' }
];

const checklist = ['Validate credential hygiene', 'Confirm MFA coverage', 'Re-test exposed services'];

export default function CompliancePage({ token }) {
  return (
    <div className="page-card">
      <div className="eyebrow">Evidence Layer</div>
      <h2>Compliance & Reporting</h2>
      <p>Track posture trends, evidence capture, and remediation confidence for every assessment cycle.</p>
      <p className="status-text" style={{ marginTop: '8px' }}>
        {token ? 'Authenticated operator session active.' : 'Running in guest mode.'}
      </p>

      <div className="report-summary" style={{ marginTop: '16px' }}>
        <div>
          <div className="eyebrow">Executive Summary</div>
          <h3>Assessment confidence remains high with one critical remediation path still open.</h3>
        </div>
        <div className="report-score">78</div>
      </div>

      <div className="feature-grid" style={{ marginTop: '16px' }}>
        <div className="feature-card">
          <h3>Risk Score</h3>
          <p>78 / 100 • Elevated exposure</p>
        </div>
        <div className="feature-card">
          <h3>Report Status</h3>
          <p>Draft ready • 6 artifacts collected</p>
        </div>
        <div className="feature-card">
          <h3>Confidence</h3>
          <p>92% • Findings supported by evidence</p>
        </div>
      </div>

      <div className="report-grid" style={{ marginTop: '16px' }}>
        <div className="feature-card report-panel">
          <h3>Assessment Timeline</h3>
          {timeline.map((item) => (
            <div key={item.title} className="timeline-item">
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="feature-card report-panel">
          <h3>Remediation Checklist</h3>
          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
