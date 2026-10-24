import { useState } from 'react';
import { api, setToken, hasToken } from './api';
import Editor from './Editor';

export default function App() {
  const [user, setUser] = useState(hasToken() ? localStorage.getItem('tw_user') || '' : '');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');

  if (user) return <Editor username={user} onLogout={() => { setToken(''); setUser(''); }} />;
  const submit = async () => {
    try { const r = await api.auth(mode, u, p); setToken(r.token, r.username); setUser(r.username); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="auth"><div className="card">
      <h1>🏡 Tiny Worlds</h1><p>Your little dream room</p>
      <input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
      <input placeholder="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div className="bad">{err}</div>}
      <button onClick={submit}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <a onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>{mode === 'login' ? 'New here? Sign up' : 'Have an account? Log in'}</a>
    </div></div>
  );
}
