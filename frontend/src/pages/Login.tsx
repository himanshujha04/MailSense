import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { login as apiLogin } from '../api/client';
import { Shield, Key, User, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password) return;
        setLoading(true);
        try {
            const res = await apiLogin(username.trim(), password);
            if (res.success && res.user) {
                login(res.user.name);
                navigate('/');
            } else {
                setError(res.message || 'Invalid username or password');
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const msg =
                    (err.response?.data as any)?.detail ||
                    (err.response?.data as any)?.message ||
                    err.message;
                setError(status ? `Login failed (${status}): ${msg}` : `Login failed: ${msg}`);
            } else {
                setError('Login failed due to an unexpected error.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            <main className="z-10 w-full max-w-md p-8 sm:p-10 glass-panel rounded-3xl animate-slide-up border border-border">
                <div className="w-full flex justify-center mb-8">
                    <div className="p-4 bg-surface-muted rounded-2xl border border-border">
                        <Shield className="w-12 h-12 text-text-muted" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-text-main">MailSense AI</h1>
                <p className="text-text-muted text-center mb-8 text-sm">Intelligent Workflow Automation</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <p className="text-sm text-scam bg-scam/10 border border-scam/30 rounded-lg px-4 py-2">{error}</p>
                    )}
                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-surface-muted border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-main focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
                            />
                        </div>
                        <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-surface-muted border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-main focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-surface-muted border border-border py-3.5 px-4 flex items-center justify-center font-medium text-text-main hover:bg-surface hover:border-accent transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            {loading ? 'Signing in…' : 'Sign in'} <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-text-muted">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="text-accent hover:underline font-medium">Register</Link>
                </p>
                <p className="mt-2 text-center text-xs text-text-muted">
                    Default: username <strong>admin</strong>, password <strong>admin</strong>
                </p>
            </main>
        </div>
    );
}
