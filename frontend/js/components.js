const { useState, useRef, useEffect, useCallback } = React;
const { API, SEV_COLORS, sevLabel, sevChip, confClass } = window.DERM_CONFIG;

const Icon = ({ name, size = 16, color = 'currentColor', sw = 1.75 }) => {
  const s = { width: size, height: size, display: 'block' };
  const p = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    aiLens: <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="10.5" cy="10.5" r="7.5"/><line x1="10.5" y1="6" x2="10.5" y2="15"/><line x1="6" y1="10.5" x2="15" y2="10.5"/><circle cx="10.5" cy="10.5" r="2.5"/><line x1="16" y1="16" x2="22" y2="22"/></svg>,
    stethoscope: <svg style={s} viewBox="0 0 24 24" {...p}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6v-3"/><circle cx="20" cy="10" r="2"/></svg>,
    microscope: <svg style={s} viewBox="0 0 24 24" {...p}><path d="M6 18h8"/><path d="M3 21h18"/><path d="M14 21v-4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4"/><path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M13 7l4 4-2.5 2.5"/><path d="M17 11l1.5 1.5"/></svg>,
    upload:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    camera:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    search:     <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    aperture:   <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg>,
    brain:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-2.16A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-2.16A2.5 2.5 0 0 0 14.5 2"/></svg>,
    barChart:   <svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    heatmap:    <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    alert:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    x:          <svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    stop:       <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>,
    play:       <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    dna:        <svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m10 16 1 1"/><path d="m2 21 1.5-1.5"/><path d="m22 3-1.5 1.5"/></svg>,
    sun:        <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    lock:       <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    user:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    logOut:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    fileText:   <svg style={s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    activity:   <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    refresh:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    eye:        <svg style={s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  };
  return icons[name] || null;
};

function Header({ dark, onToggle, onLogout, user }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-icon">
            <Icon name="aiLens" size={18} color="#fff" />
          </div>
          <span className="brand-name">Skin Disease Classifier</span>
        </div>
        <div className="topbar-right">
          <button className="theme-toggle" onClick={onToggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} style={{ position: 'static' }}>
            <Icon name={dark ? 'sun' : 'moon'} size={15} color="var(--text-3)" />
          </button>
          <div style={{ textAlign: 'right', marginLeft: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{user?.full_name || user?.username}</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.05em' }}>{user?.role}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ height: 34, marginLeft: 4 }}>
            <Icon name="logOut" size={14} /> Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

function AuthView({ onLogin, onSignup, loading, error: serverError, dark, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    setLocalError(null);
    
    if (!isLogin && pass !== confirmPass) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (isLogin) onLogin(user, pass);
    else onSignup(user, pass, fullName);
  };

  const error = localError || serverError;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background: 'linear-gradient(135deg, var(--blue-light) 0%, var(--bg) 100%)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button 
          className="theme-toggle" 
          onClick={onToggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}
        >
          <Icon name={dark ? "sun" : "moon"} size={18} />
        </button>
      </div>
      <div className="card" style={{ width:400, padding:32, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div className="brand-icon" style={{ width:48, height:48, margin:'0 auto 16px', borderRadius:12 }}>
            <Icon name="aiLens" size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-.02em' }}>{isLogin ? 'Skin Disease Classifier' : 'Create Account'}</h1>
          <p style={{ fontSize:14, color:'var(--text-3)', marginTop:6 }}>{isLogin ? 'AI-powered clinical diagnosis' : 'Register for diagnostic access'}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-3)', marginBottom:6, textTransform:'uppercase' }}>Full Name</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-4)' }}>
                  <Icon name="dna" size={14} />
                </span>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required={!isLogin}
                  style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-1)', fontSize:14, outline:'none' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-3)', marginBottom:6, textTransform:'uppercase' }}>Username</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-4)' }}>
                <Icon name="user" size={14} />
              </span>
              <input 
                type="text" 
                value={user} 
                onChange={e => setUser(e.target.value)}
                placeholder="Enter username"
                required
                style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-1)', fontSize:14, outline:'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-3)', marginBottom:6, textTransform:'uppercase' }}>Password</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-4)' }}>
                <Icon name="lock" size={14} />
              </span>
              <input 
                type={showPass ? "text" : "password"} 
                value={pass} 
                onChange={e => setPass(e.target.value)}
                placeholder="Enter password"
                required
                style={{ width:'100%', padding:'10px 40px 10px 36px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-1)', fontSize:14, outline:'none' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}
              >
                <Icon name={showPass ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          </div>

          {!isLogin && (
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-3)', marginBottom:6, textTransform:'uppercase' }}>Confirm Password</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-4)' }}>
                  <Icon name="lock" size={14} />
                </span>
                <input 
                  type={showConfirm ? "text" : "password"} 
                  value={confirmPass} 
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Confirm your password"
                  required={!isLogin}
                  style={{ width:'100%', padding:'10px 40px 10px 36px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-1)', fontSize:14, outline:'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}
                >
                  <Icon name={showConfirm ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-box" style={{ marginBottom:20 }}>
              <Icon name="alert" size={15} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !user || !pass || (!isLogin && !confirmPass)}>
            {loading ? <span className="spinner" /> : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop:20, textAlign:'center', fontSize:13 }}>
          <span style={{ color:'var(--text-3)' }}>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button 
            onClick={() => { setIsLogin(!isLogin); setLocalError(null); }}
            style={{ background:'none', border:'none', color:'var(--blue)', fontWeight:600, cursor:'pointer', padding:0 }}
          >
            {isLogin ? 'Create one' : 'Log in instead'}
          </button>
        </div>
        
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [view, setView] = useState('reports');
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rResp = await fetch(`${API}/admin/reports`);
      const rData = await rResp.json();
      setReports(rData.reports || []);

      const lResp = await fetch(`${API}/admin/logs`);
      const lData = await lResp.json();
      setLogs(lData.logs || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-.02em' }}>Administrative Control Center</h1>
        <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
          <Icon name="refresh" size={14} /> Refresh Data
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        <div className="stat-card">
          <span className="stat-val">{reports.length}</span>
          <span className="stat-label">Total Diagnoses</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{new Set(reports.map(r => r.user_id)).size}</span>
          <span className="stat-label">Active Patients</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{logs.length}</span>
          <span className="stat-label">System Events</span>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="mode-tabs">
            <button className={`mode-tab ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
              <Icon name="fileText" size={14} /> Diagnostic Reports
            </button>
            <button className={`mode-tab ${view === 'logs' ? 'active' : ''}`} onClick={() => setView('logs')}>
              <Icon name="activity" size={14} /> Audit & Access Logs
            </button>
          </div>

          {loading ? (
            <div className="empty"><span className="spinner" style={{ borderColor:'var(--blue)', borderTopColor:'#fff' }} /></div>
          ) : view === 'reports' ? (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Patient</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id}>
                      <td>{r.timestamp}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{r.patient_name}</div>
                        <div style={{ fontSize:11, color:'var(--text-4)' }}>@{r.patient_username}</div>
                      </td>
                      <td style={{ fontWeight:500 }}>{r.prediction_class}</td>
                      <td>{(r.confidence).toFixed(1)}%</td>
                      <td><span className={`chip ${sevChip(r.severity)}`}>{sevLabel(r.severity)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td>{l.timestamp}</td>
                      <td>{l.username ? `@${l.username}` : 'System'}</td>
                      <td><span style={{ fontWeight:600, textTransform:'uppercase', fontSize:11 }}>{l.action}</span></td>
                      <td className="log-details">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadPanel({ onPredict, loading, error }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag]       = useState(false);
  const inputRef              = useRef();

  function pick(f) {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function reset() { setFile(null); setPreview(null); }

  async function analyze() {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    await onPredict(form, null);
  }

  return (
    <div>
      <div
        className={`upload-zone ${drag ? 'dragover' : ''} ${preview ? 'has-image' : ''}`}
        onClick={() => !preview && inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDrag(true); }}
        onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDrag(true); }}
        onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDrag(false); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); setDrag(false); if(e.dataTransfer.files && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); }}
      >
        {preview ? (
          <>
            <img src={preview} className="upload-preview" alt="Preview" />
            <button className="upload-clear" onClick={e => { e.stopPropagation(); reset(); }}>
              <Icon name="x" size={12} />
            </button>
          </>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:2 }}>
              <Icon name="upload" size={32} color="var(--text-4)" sw={1.5} />
            </div>
            <div className="upload-label">Drop an image here, or click to browse</div>
            <div className="upload-hint">JPG · PNG · WEBP · max 16 MB</div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => pick(e.target.files[0])} />
      </div>

      {error && (
        <div className="error-box">
          <Icon name="alert" size={15} />{error}
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-primary btn-full" disabled={!file || loading} onClick={analyze}>
          {loading
            ? <><span className="spinner" /> Analyzing…</>
            : <><Icon name="search" size={14} color="#fff" /> Analyze Image</>}
        </button>
      </div>
    </div>
  );
}

function CameraPanel({ onPredict, loading, error }) {
  const videoRef    = useRef();
  const intervalRef = useRef();
  const [streaming, setStreaming] = useState(false);
  const [live, setLive]           = useState(false);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch { alert('Camera access denied.'); }
  }

  function stop() {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    stopLive();
  }

  function frame() {
    const v = videoRef.current;
    const c = document.getElementById('capture-canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.8);
  }

  function startLive() {
    if (!streaming) return;
    setLive(true);
    intervalRef.current = setInterval(() => { if (!loading) onPredict(null, frame()); }, 2500);
  }

  function stopLive() { setLive(false); clearInterval(intervalRef.current); }

  useEffect(() => () => stop(), []);

  return (
    <div>
      <div className="cam-wrap">
        <video ref={videoRef} className={`cam-video ${streaming ? 'on' : ''}`} autoPlay playsInline muted />
        {!streaming && (
          <div className="cam-offline">
            <Icon name="camera" size={36} color="var(--cam-icon)" sw={1.5} />
            <span>Camera inactive</span>
          </div>
        )}
        {streaming && (
          <>
            <div className="cam-corners">
              <div className="cam-corner tl" /><div className="cam-corner tr" />
              <div className="cam-corner bl" /><div className="cam-corner br" />
            </div>
            <div className={`cam-badge ${live ? 'live' : 'idle'}`}>
              {live ? '● LIVE' : '○ READY'}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="error-box" style={{ marginTop: 10 }}>
          <Icon name="alert" size={15} />{error}
        </div>
      )}

      <div className="btn-row">
        {!streaming ? (
          <button className="btn btn-primary" onClick={start}>
            <Icon name="camera" size={14} color="#fff" /> Start Camera
          </button>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={stop}>
              <Icon name="stop" size={10} color="var(--text-2)" /> Stop
            </button>
            <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => onPredict(null, frame())}>
              {loading ? <span className="spinner" /> : <Icon name="aperture" size={13} color="#fff" />} Capture
            </button>
            {!live
              ? <button className="btn btn-success btn-sm" onClick={startLive}>
                  <Icon name="play" size={10} color="var(--green)" /> Live
                </button>
              : <button className="btn btn-danger btn-sm" onClick={stopLive}>
                  <Icon name="stop" size={10} color="var(--red)" /> Stop Live
                </button>
            }
          </>
        )}
      </div>

      {live && (
        <div className="live-bar">
          <span className="chip-dot pulse" style={{ background:'var(--green)' }} />
          Detecting every 2.5 s
        </div>
      )}
    </div>
  );
}

function ResultsPanel({ result, origSrc }) {
  if (!result) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="card-icon" style={{ background:'var(--blue-light)' }}>
            <Icon name="search" size={15} color="var(--blue)" />
          </div>
          <div className="card-title">Analysis Results</div>
        </div>
        <div className="empty">
          <div className="empty-icon">
            <Icon name="dna" size={48} color="var(--text-4)" sw={1.4} />
          </div>
          <div className="empty-title">No analysis yet</div>
          <div className="empty-hint">Upload a skin image or use the camera to receive a diagnosis with Grad-CAM visualization.</div>
        </div>
      </div>
    );
  }

  const { prediction: pred, all_probabilities: probs, gradcam_image: gcam } = result;
  const sev = pred.severity || 'low';
  const cc  = confClass(pred.confidence);

  return (
    <div className="results-stack">
      <div className="pred-hero">
        <div className="card-head" style={{ padding:'18px 20px 0' }}>
          <div className="card-icon" style={{ background:'var(--blue-light)' }}>
            <Icon name="search" size={15} color="var(--blue)" />
          </div>
          <div className="card-title">Analysis Results</div>
        </div>
        <div className="pred-body">
          <div className="pred-name">{pred.class}</div>
          <div className="pred-desc">{pred.description}</div>

          <div className="conf-row">
            <span className="conf-label">Confidence</span>
            <span className={`conf-value ${cc}`}>{pred.confidence.toFixed(1)}%</span>
          </div>
          <div className="conf-track">
            <div className="conf-fill" style={{ width:`${pred.confidence}%`, background: SEV_COLORS[sev] }} />
          </div>

          <div className="sev-row">
            <span className={`chip ${sevChip(sev)}`}>{sevLabel(sev)}</span>
            <span style={{ fontSize:12, color:'var(--text-3)' }}>Severity classification</span>
          </div>

          <div className="rec-box">
            <span className="rec-label">Clinical Recommendation</span>
            {pred.recommendation}
          </div>
        </div>
      </div>

      {gcam && (
        <div className="card">
          <div className="card-head">
            <div className="card-icon" style={{ background:'var(--blue-light)' }}>
              <Icon name="heatmap" size={15} color="var(--blue)" />
            </div>
            <div className="card-title">Grad-CAM Activation Map</div>
          </div>
          <div className="card-body">
            <div className="gcam-grid">
              {origSrc && (
                <div className="gcam-wrap">
                  <img src={origSrc} alt="Original" />
                  <div className="gcam-label">Original</div>
                </div>
              )}
              <div className="gcam-wrap">
                <img src={gcam} alt="Grad-CAM" />
                <div className="gcam-label">Activation Map</div>
              </div>
            </div>
            <p style={{ fontSize:11.5, color:'var(--text-4)', marginTop:10, lineHeight:1.6, fontFamily:'var(--mono)' }}>
              Warm regions (red/yellow) highlight areas most influential in the prediction.
            </p>
          </div>
        </div>
      )}

      {probs && (
        <div className="card">
          <div className="card-head">
            <div className="card-icon" style={{ background:'var(--blue-light)' }}>
              <Icon name="barChart" size={15} color="var(--blue)" />
            </div>
            <div className="card-title">Class Probabilities</div>
          </div>
          <div className="card-body">
            <div className="prob-list">
              {probs.map((item, i) => (
                <div key={item.class} className="prob-item">
                  <div className={`prob-name ${i === 0 ? 'top' : ''}`}>{item.class}</div>
                  <div className="prob-track">
                    <div className={`prob-fill ${i === 0 ? 'top' : ''}`} style={{ width:`${item.probability}%` }} />
                  </div>
                  <div className={`prob-pct ${i === 0 ? 'top' : ''}`}>{item.probability.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Global exposure
window.DERM_COMPONENTS = { Icon, Header, AuthView, AdminDashboard, UploadPanel, CameraPanel, ResultsPanel };
