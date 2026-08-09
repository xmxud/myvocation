import { useState, useCallback } from 'react';
import { authApi } from '../src/utils/api.js';
import heroBg from '../images/hero-bg.jpg';

/* ========================================
   SVG Icons (HUD Style)
   ======================================== */

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" stroke="var(--color-primary)" strokeWidth="2" />
      <rect x="6" y="6" width="20" height="20" stroke="var(--color-primary)" strokeWidth="1" opacity="0.5" />
      <text x="16" y="21" textAnchor="middle" fill="var(--color-primary)" fontFamily="Orbitron, monospace" fontSize="14" fontWeight="900">
        26
      </text>
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="2" y1="20" x2="6" y2="20" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="26" y1="12" x2="30" y2="12" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="26" y1="20" x2="30" y2="20" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="20" y1="2" x2="20" y2="6" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="12" y1="26" x2="12" y2="30" stroke="var(--color-primary)" strokeWidth="1" />
      <line x1="20" y1="26" x2="20" y2="30" stroke="var(--color-primary)" strokeWidth="1" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="m14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

function CornerTL() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="0" y1="20" x2="0" y2="0" /><line x1="0" y1="0" x2="20" y2="0" />
      <line x1="0" y1="16" x2="0" y2="8" /><line x1="0" y1="8" x2="8" y2="0" /><line x1="16" y1="0" x2="16" y2="0" />
    </svg>
  );
}

function CornerTR() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="80" y1="20" x2="80" y2="0" /><line x1="80" y1="0" x2="60" y2="0" />
    </svg>
  );
}

function CornerBL() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="0" y1="60" x2="0" y2="80" /><line x1="0" y1="80" x2="20" y2="80" />
    </svg>
  );
}

function CornerBR() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="80" y1="60" x2="80" y2="80" /><line x1="80" y1="80" x2="60" y2="80" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetForm = useCallback(() => {
    setUsername('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  }, []);

  const switchMode = useCallback((m) => {
    setMode(m);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('请填写用户名和密码');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMsg('请填写显示名称');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('密码长度至少 6 位');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await authApi.login(username.trim(), password);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        const data = await authApi.register(username.trim(), displayName.trim(), password);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [mode, username, displayName, password, confirmPassword, onLoginSuccess]);

  return (
    <div className="login-page">
      {/* Background image */}
      <div className="hero-bg">
        <img src={heroBg} alt="" />
      </div>
      <div className="hero-overlay"></div>

      {/* Tactical grid background */}
      <div className="login-grid" />

      {/* Scanline overlay */}
      <div className="login-scanline" />

      {/* Corner decorations */}
      <div className="login-corner" style={{ top: 24, left: 24 }}><CornerTL /></div>
      <div className="login-corner" style={{ top: 24, right: 24 }}><CornerTR /></div>
      <div className="login-corner" style={{ bottom: 24, left: 24 }}><CornerBL /></div>
      <div className="login-corner" style={{ bottom: 24, right: 24 }}><CornerBR /></div>

      {/* Login card */}
      <div className="login-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: 'var(--color-text-accent)',
            marginBottom: 4,
          }}>
            <LogoIcon />
            关键行动小助理
          </h1>
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            ACTION ASSISTANT
          </p>
        </div>

        {/* Card body */}
        <div className="login-card-body">
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 28 }}>
            <button
              type="button"
              className="login-tab"
              onClick={() => switchMode('login')}
              style={{
                color: mode === 'login' ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                borderBottom: mode === 'login' ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              SIGN IN
            </button>
            <button
              type="button"
              className="login-tab"
              onClick={() => switchMode('register')}
              style={{
                color: mode === 'register' ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                borderBottom: mode === 'register' ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              REGISTER
            </button>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="login-error">
              <AlertIcon />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div>
              <label className="login-label">CALLSIGN</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  autoComplete="username"
                  className="login-input"
                />
              </div>
            </div>

            {/* Display name (register only) */}
            {mode === 'register' && (
              <div>
                <label className="login-label">DISPLAY NAME</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="输入显示名称"
                    autoComplete="name"
                    className="login-input"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="login-label">AUTH CODE</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="login-input login-input-icon"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 0, top: 0, bottom: 0,
                    width: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <div>
                <label className="login-label">CONFIRM CODE</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    className="login-input"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '12px 0',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: '1px solid var(--color-primary)',
                background: loading ? 'transparent' : 'var(--color-primary)',
                color: loading ? 'var(--color-text-accent)' : 'var(--color-text-inverse)',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 200ms',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 14, height: 14,
                    border: '2px solid var(--color-text-accent)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'login-spin 0.6s linear infinite',
                  }} />
                  AUTHENTICATING...
                </span>
              ) : mode === 'login' ? (
                'ACCESS GRANTED'
              ) : (
                'INITIALIZE'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer-text">
          SECURE CONNECTION · TLS 1.3
        </p>
      </div>
    </div>
  );
}
