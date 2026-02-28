import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { register as apiRegister } from '../api/client';
import { Shield, Key, User, Mail, ArrowRight } from 'lucide-react';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim()) {
            setError('Username is required');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        setLoading(true);
        try {
            const res = await apiRegister(username.trim(), email.trim(), password);
            if (res.success && res.user) {
                login(res.user.name);
                navigate('/');
            } else {
                setError(res.message || 'Registration failed');
            }
        } catch (_) {
            setError('Registration failed. Is the server running?');
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

                <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-text-main">Create account</h1>
                <p className="text-text-muted text-center mb-8 text-sm">Register to use MailSense AI</p>

                <form onSubmit={handleRegister} className="space-y-5">
                    {error && (
                        <p className="text-sm text-scam bg-scam/10 border border-scam/30 rounded-lg px-4 py-2">{error}</p>
                    )}
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
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="email"
                            placeholder="Email (optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-50" />
                        <input
                            type="password"
                            placeholder="Confirm password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface-muted border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-main focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-surface-muted border border-border py-3.5 px-4 flex items-center justify-center font-medium text-text-main hover:bg-surface hover:border-accent transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            {loading ? 'Creating account…' : 'Register'} <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
                </p>
            </main>
        </div>
    );
}
