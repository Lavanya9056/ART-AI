import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const NAV = [
  { group: 'OPERATIONS', items: [
    { id: 'home',       label: 'Overview',    icon: '⬡' },
    { id: 'scanner',    label: 'Scanner',     icon: '⬡' },
    { id: 'simulation', label: 'Simulation',  icon: '⬡' },
    { id: 'compliance', label: 'Compliance',  icon: '⬡' },
  ]},
  { group: 'INTELLIGENCE', items: [
    { id: 'chat',       label: 'AI Copilot',  icon: '⬡' },
  ]},
  { group: 'AI STUDIO', items: [
    { id: 'studio',     label: 'Image Studio',icon: '⬡' },
  ]},
];

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      if (mode === 'register') {
        await axios.post(`${API}/auth/register`, form);
        setMode('login');
        setForm(f => ({ ...f, name: '', password: '' }));
        setMsg({ text: 'Account created. Sign in to continue.', type: 'ok' });
      } else {
        const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
        const tok = res.data.access_token;
        localStorage.setItem('art_ai_token', tok);
        const user = await axios.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${tok}` } });
        onAuth(tok, user.data);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || 'Authentication failed.', type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="auth-card">
        <div className="eyebrow">ART-AI / Access Portal</div>
        <h2>{mode === 'login' ? 'Sign in to continue' : 'Create operator account'}</h2>
        <p className="sub">Autonomous Red Team Intelligence — Authorized operators only.</p>
        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setMsg({ text: '', type: '' }); }}>Sign In</button>
          <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setMsg({ text: '', type: '' }); }}>Register</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="field"><label>Full name</label><input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          )}
          <div className="field"><label>Email</label><input type="email" placeholder="operator@artai.io" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
          <div className="field"><label>Password</label><input type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} /></div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }} disabled={loading}>
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      </div>
    </div>
  );
}

export { API };
export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [apiUp, setApiUp] = useState(false);

  useEffect(() => {
    const check = async () => {
      try { await axios.get(`${API}/health`, { timeout: 4000 }); setApiUp(true); }
      catch { setApiUp(false); }
    };
    check();
    const stored = localStorage.getItem('art_ai_token');
    if (stored) {
      setToken(stored);
      axios.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${stored}` } })
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('art_ai_token'); setToken(''); });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('art_ai_token');
    setToken(''); setUser(null); setView('home');
  };

  if (!token) return <AuthScreen onAuth={(t, u) => { setToken(t); setUser(u); }} />;

  return (
    <div className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="grid-bg" />
      <Sidebar view={view} setView={setView} user={user} apiUp={apiUp} logout={logout} />
      <main className="content">
        <PageRouter view={view} token={token} />
      </main>
    </div>
  );
}

function Sidebar({ view, setView, user, apiUp, logout }) {
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'OP';
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-eye">ART-AI</div>
        <h1>Autonomous Red Team</h1>
        <p>Intelligence Platform</p>
      </div>
      {NAV.map(group => (
        <div key={group.group} className="nav-group">
          <div className="nav-group-label">{group.group}</div>
          {group.items.map(item => (
            <button key={item.id} className={`nav-btn${view === item.id ? ' active' : ''}`} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      ))}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Operator'}</div>
            <div className="user-role">{user?.role || 'operator'}</div>
          </div>
        </div>
        <div className="status-row">
          <div className={`api-dot${apiUp ? ' up' : ''}`} />
          <span>API {apiUp ? 'Online' : 'Offline'}</span>
        </div>
        <button className="btn-ghost btn-danger" onClick={logout}>Sign Out</button>
      </div>
    </aside>
  );
}

function PageRouter({ view, token }) {
  const pages = {
    home:       () => import('./pages/HomePage.jsx'),
    scanner:    () => import('./pages/ScannerPage.jsx'),
    simulation: () => import('./pages/SimulationPage.jsx'),
    compliance: () => import('./pages/CompliancePage.jsx'),
    chat:       () => import('./pages/ChatPage.jsx'),
    studio:     () => import('./pages/HomePage.jsx'),
  };
  const [Page, setPage] = useState(null);
  useEffect(() => {
    const loader = pages[view] || pages.home;
    loader().then(m => setPage(() => m.default));
  }, [view]);
  if (!Page) return <div style={{ padding: 40, color: 'var(--t2)' }}>Loading…</div>;
  return <Page token={token} />;
}
