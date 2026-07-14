import { useEffect, useState } from 'react';
import axios from 'axios';
import HomePage from './pages/HomePage';
import ScannerPage from './pages/ScannerPage';
import SimulationPage from './pages/SimulationPage';
import CompliancePage from './pages/CompliancePage';
import ChatPage from './pages/ChatPage';

const navItems = [
  { id: 'home', label: 'Overview' },
  { id: 'scanner', label: 'Scanner' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'chat', label: 'Copilot' }
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [activeView, setActiveView] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [authMessageType, setAuthMessageType] = useState('error'); // 'error' or 'success'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [activityLog, setActivityLog] = useState([
    { id: 1, text: 'System initialized', detail: 'Ready for authentication.', time: 'just now' }
  ]);

  const addActivity = (text, detail) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivityLog((prev) => [{ id: Date.now(), text, detail, time: timestamp }, ...prev].slice(0, 6));
  };

  const handleLogout = (reason = 'Signed out.') => {
    localStorage.removeItem('art_ai_token');
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
    setAuthMessage(reason);
    setActiveView('home');
    addActivity('Session ended', reason);
  };

  const checkApiHealth = async () => {
    setApiStatus('checking');
    try {
      await axios.get(`${API_BASE_URL}/health`, { timeout: 4000 });
      setApiStatus('online');
      addActivity('Connection established', 'Backend API is online.');
    } catch (error) {
      setApiStatus('offline');
      addActivity('Connection failed', 'Unable to reach backend API.');
    }
  };

  const loadUser = async (currentToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout('Session expired. Please sign in again.');
      } else {
        handleLogout('Unable to verify session. Please sign in again.');
      }
    }
  };

  useEffect(() => {
    checkApiHealth();

    const storedToken = localStorage.getItem('art_ai_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      loadUser(storedToken);
    }
  }, []);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setAuthMessage('');

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      if (authMode === 'register') {
        setAuthMode('login');
        setAuthForm((prev) => ({ ...prev, name: '', password: '' }));
        setAuthMessage('Account created successfully. Please sign in.');
        setAuthMessageType('success');
      } else {
        const nextToken = response.data.access_token;
        localStorage.setItem('art_ai_token', nextToken);
        setToken(nextToken);
        setIsAuthenticated(true);
        await loadUser(nextToken);
        setAuthMessage('Welcome back!');
        setAuthMessageType('success');
        addActivity('Authenticated', 'Session started successfully.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setAuthMessage(errorMsg);
      setAuthMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    if (authMessage) setAuthMessage('');
  };

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setAuthMessage('');
    setAuthForm({ name: '', email: '', password: '' });
  };

  const renderView = () => {
    switch (activeView) {
      case 'scanner':
        return <ScannerPage token={token} />;
      case 'simulation':
        return <SimulationPage token={token} />;
      case 'compliance':
        return <CompliancePage token={token} />;
      case 'chat':
        return <ChatPage token={token} />;
      default:
        return <HomePage token={token} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <div className="grid-glow" />

        <div className="auth-panel">
          <div className="eyebrow">ART-AI / Access Portal</div>
          <h2>{authMode === 'login' ? 'Sign in to continue' : 'Create your operator account'}</h2>
          <p>Secure your workspace and unlock the protected workflows behind the dashboard.</p>

          <div className="auth-switch">
            <button
              type="button"
              className={`auth-toggle ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => handleAuthModeChange('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-toggle ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => handleAuthModeChange('register')}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <input
                className="auth-field"
                type="text"
                placeholder="Full name"
                value={authForm.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                required
              />
            )}

            <input
              className="auth-field"
              type="email"
              placeholder="Email address"
              value={authForm.email}
              onChange={(event) => handleInputChange('email', event.target.value)}
              required
            />

            <input
              className="auth-field"
              type="password"
              placeholder="Password (min 8 characters)"
              value={authForm.password}
              onChange={(event) => handleInputChange('password', event.target.value)}
              required
              minLength={8}
            />

            <button className="generate-btn" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {authMessage && (
            <p className={`status-text ${authMessageType === 'success' ? 'success' : ''}`}>
              {authMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="grid-glow" />

      <main className="app-frame">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="eyebrow">ART-AI</div>
            <h2>Autonomous Security OS</h2>
          </div>

          <div className="user-card">
            <div className="eyebrow">Operator</div>
            <strong>{user?.name || 'Operator'}</strong>
            <p>{user?.email || 'Signed in securely'}</p>
            <p className="api-status-row" style={{ marginTop: '6px' }}>
              <span className={`api-status-dot ${apiStatus === 'online' ? 'online' : 'offline'}`} />
              <span>API</span>
              <strong>{apiStatus === 'online' ? 'Online' : 'Offline'}</strong>
            </p>
          </div>

          <nav className="nav-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-btn ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="activity-card">
            <div className="activity-header">
              <div className="eyebrow">Activity</div>
              <span className="activity-live">Live</span>
            </div>
            <div className="activity-list">
              {activityLog.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-meta">
                    <strong>{item.text}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="logout-btn" type="button" onClick={() => checkApiHealth()}>
            Reconnect
          </button>

          <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <section className="content-panel">
          {renderView()}
        </section>
      </main>
    </div>
  );
}

export default App;
