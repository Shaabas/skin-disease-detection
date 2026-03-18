const { API, SEV_COLORS, sevLabel, sevChip, confClass } = window.DERM_CONFIG;
const { Icon, Header, AuthView, AdminDashboard, UploadPanel, CameraPanel, ResultsPanel } = window.DERM_COMPONENTS;

function App() {
  const [mode, setMode]     = useState('upload');
  const [result, setResult] = useState(null);
  const [origSrc, setOrig]  = useState(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('derm-auth') === 'true');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('derm-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [dark, setDark]     = useState(() => {
    const saved = localStorage.getItem('derm-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('derm-theme', dark ? 'dark' : 'light');
  }, [dark]);


  const handleLogin = async (username, password) => {
    setLoad(true);
    setError(null);
    try {
      const resp = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (data.success) {
        setIsLoggedIn(true);
        setUser(data.user);
        localStorage.setItem('derm-auth', 'true');
        localStorage.setItem('derm-user', JSON.stringify(data.user));
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('derm-auth');
    localStorage.removeItem('derm-user');
    setResult(null);
  };

  const handleSignup = async (username, password, full_name) => {
    setLoad(true);
    setError(null);
    try {
      const resp = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, full_name })
      });
      const data = await resp.json();
      if (data.success) {
        // Auto login after signup
        await handleLogin(username, password);
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  };

  const handlePredict = useCallback(async (formData, b64) => {
    setLoad(true);
    setError(null);
    try {
      let resp;
      if (formData) {
        formData.append('user_id', user.id);
        setOrig(URL.createObjectURL(formData.get('file')));
        resp = await fetch(`${API}/predict`, { method:'POST', body: formData });
      } else {
        setOrig(b64);
        resp = await fetch(`${API}/predict-base64`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ image: b64, user_id: user.id }),
        });
      }
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      if (!data.success) {
        if (data.code === 'NO_SKIN') setResult(null);
        throw new Error(data.error || 'Prediction failed');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  }, [user]);

  if (!isLoggedIn) {
    return <AuthView 
      onLogin={handleLogin} 
      onSignup={handleSignup} 
      loading={loading} 
      error={error} 
      dark={dark}
      onToggleTheme={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.className = next ? 'dark' : 'light';
        localStorage.setItem('theme', next ? 'dark' : 'light');
      }}
    />;
  }

  return (
    <div>
      <Header dark={dark} onToggle={() => setDark(d => !d)} onLogout={handleLogout} user={user} />
      
      <div className="page">
        {user.role === 'admin' && (
          <div className="mode-tabs" style={{ marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            <button className={`mode-tab ${mode === 'upload' || mode === 'camera' ? 'active' : ''}`} onClick={() => setMode('upload')}>
              <Icon name="aiLens" size={14} /> Diagnostic Tools
            </button>
            <button className={`mode-tab ${mode === 'admin' ? 'active' : ''}`} onClick={() => setMode('admin')}>
              <Icon name="lock" size={14} /> System Management
            </button>
          </div>
        )}

        {mode === 'admin' && user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="grid">
            <div>
              <div className="card">
                <div className="card-head">
                  <div className="card-icon" style={{ background:'var(--blue-light)' }}>
                    <Icon name="upload" size={15} color="var(--blue)" />
                  </div>
                  <div className="card-title">Input</div>
                </div>
                <div className="card-body" style={{ paddingTop:16 }}>
                  <div className="mode-tabs">
                    <button className={`mode-tab ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>
                      <Icon name="upload" size={14} color={mode === 'upload' ? 'var(--text-1)' : 'var(--text-3)'} /> Upload Image
                    </button>
                    <button className={`mode-tab ${mode === 'camera' ? 'active' : ''}`} onClick={() => setMode('camera')}>
                      <Icon name="camera" size={14} color={mode === 'camera' ? 'var(--text-1)' : 'var(--text-3)'} /> Live Camera
                    </button>
                  </div>
                  {mode === 'upload'
                    ? <UploadPanel onPredict={handlePredict} loading={loading} error={error} />
                    : <CameraPanel onPredict={handlePredict} loading={loading} error={error} />}
                </div>
              </div>

              <div className="card" style={{ marginTop:16 }}>
                <div className="card-head">
                  <div className="card-icon" style={{ background:'var(--blue-light)' }}>
                    <Icon name="brain" size={15} color="var(--blue)" />
                  </div>
                  <div className="card-title">Model Information</div>
                </div>
                <div className="card-body">
                  <div className="info-table">
                    {[
                      ['Architecture',   'ConvNeXt V2 (CNN)'],
                      ['Dataset',        'HAM10000 (10,015 images)'],
                      ['Classes',        '7 skin conditions'],
                      ['Input size',     '224 × 224 px'],
                      ['Explainability', 'Grad-CAM'],
                    ].map(([k, v]) => (
                      <div key={k} className="info-row">
                        <span className="info-key">{k}</span>
                        <span className="info-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <ResultsPanel result={result} origSrc={origSrc} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
