import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

function ScoreRing({ score }) {
  const r = 34, c = 2 * Math.PI * r;
  const fill = (score / 100) * c;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#ef4444';
  return (
    <div className="score-ring" style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '1.1rem', fontWeight: 700, color }}>
        {score}
      </div>
    </div>
  );
}

export default function CompliancePage({ token }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});

  const fetchReport = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API}/compliance/report`, { headers: { Authorization: `Bearer ${token}` } });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load compliance report.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  const toggle = (cat) => setOpen(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">ART-AI / Compliance</div>
          <h2>Security Compliance</h2>
          <p className="sub">Static analysis of 13 security controls across 5 categories.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchReport} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="msg err">{error} <button className="btn btn-outline btn-sm" style={{ marginLeft: 8 }} onClick={fetchReport}>Retry</button></div>}

      {loading && !report && (
        <div className="state-box">
          <div className="spinner" />
          <div className="state-title">Loading compliance report...</div>
        </div>
      )}

      {report && (
        <>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <ScoreRing score={report.overall_score} />
            <div>
              <div className="eyebrow">Overall Security Posture</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
                {report.posture}
              </div>
              <p style={{ fontSize: '.84rem', color: 'var(--t2)', maxWidth: 480, marginTop: 4 }}>
                {report.note}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Pass', val: report.summary.pass, cls: 'badge-pass' },
                { label: 'Partial', val: report.summary.partial, cls: 'badge-partial' },
                { label: 'Fail', val: report.summary.fail, cls: 'badge-fail' },
                { label: 'Not Tested', val: report.summary.not_tested, cls: 'badge-not_tested' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--t1)' }}>{s.val}</div>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {report.categories.map(cat => (
              <div key={cat.category} className="comp-category">
                <div className="comp-cat-header" onClick={() => toggle(cat.category)}>
                  <div>
                    <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--t1)' }}>{cat.category}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--t2)', marginTop: 2 }}>{cat.checks.length} controls</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '.85rem', fontWeight: 700, color: cat.score >= 75 ? 'var(--ok)' : cat.score >= 50 ? 'var(--warn)' : 'var(--err)' }}>
                        {cat.score}%
                      </div>
                    </div>
                    <span style={{ color: 'var(--t3)', fontSize: '1rem' }}>{open[cat.category] ? '▲' : '▼'}</span>
                  </div>
                </div>
                {open[cat.category] && (
                  <div className="comp-checks">
                    {cat.checks.map(check => (
                      <div key={check.id} className="comp-check">
                        <div style={{ paddingTop: 2 }}>
                          <StatusBadge status={check.status} />
                        </div>
                        <div className="comp-check-body">
                          <div className="comp-check-title">
                            <span style={{ color: 'var(--t3)', marginRight: 6, fontSize: '.75rem' }}>{check.id}</span>
                            {check.title}
                          </div>
                          <div className="comp-check-desc">{check.description}</div>
                          {check.evidence && (
                            <div className="comp-check-evidence">Evidence: {check.evidence}</div>
                          )}
                          {check.recommendation && check.status !== 'pass' && (
                            <div style={{ fontSize: '.78rem', color: 'var(--cyan)', marginTop: 4 }}>
                              Recommendation: {check.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p style={{ fontSize: '.75rem', color: 'var(--t3)', textAlign: 'center' }}>
            Generated {new Date(report.generated_at).toLocaleString()} · {report.total_checks} controls assessed
          </p>
        </>
      )}
    </div>
  );
}
