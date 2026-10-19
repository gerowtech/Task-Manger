'use client';
import { FormEvent, useEffect, useState } from 'react';
import { readJson, apiFetch } from '../lib/api';

const API = '/api';

export default function Page() {
  const [email, setEmail] = useState('admin@example.com');
  const [pw, setPw] = useState('Admin@12345');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('rememberMe');
    if (saved !== null) setRememberMe(saved === 'true');
  }, []);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw, rememberMe }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error(d.message || 'Login failed');
      localStorage.setItem('rememberMe', String(rememberMe));
      localStorage.setItem('accessToken', d.accessToken);
      localStorage.setItem('refreshToken', d.refreshToken);
      localStorage.setItem('user', JSON.stringify(d.user));
      window.location.href = '/dashboard';
    } catch (e) {
      const message = e instanceof TypeError
        ? 'Unable to connect to the REST API. Make sure the server is running on port 5000.'
        : e instanceof Error ? e.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="login-card w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="login-brand text-center mb-8">
          <div className="brand-icon mx-auto mb-4 h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">TM</div>
          <h1 className="login-title text-2xl font-bold">Welcome Back</h1>
          <p className="login-subtitle text-slate-500 mt-1">Sign in to your Task Management System</p>
        </div>
        <form onSubmit={login} className="login-body space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-slate-400" value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input className="w-full rounded-lg border p-3 pr-12 outline-none focus:ring-2 focus:ring-slate-400" value={pw} onChange={e=>setPw(e.target.value)} type={show?'text':'password'} required />
              <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-sm text-slate-500">{show?'Hide':'Show'}</button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="rememberMe" className="flex gap-2 items-center cursor-pointer"><input id="rememberMe" name="rememberMe" type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} /> Remember me</label>
            <button type="button" className="text-slate-700">Forgot password?</button>
          </div>
          {error && <div className="error-message rounded-lg bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
          <button disabled={loading} className="login-button w-full rounded-lg bg-slate-900 text-white py-3 font-semibold disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="demo-box mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-600"><b>Demo:</b> admin@example.com / Admin@12345</div>
      </div>
    </main>
  );
}
