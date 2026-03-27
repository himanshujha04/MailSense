import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getUser, updateUser, deleteUser } from '../api/client';
import { useAuth } from '../contexts/useAuth';
import { User as UserIcon, Mail, Key, Save, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [deletePassword, setDeletePassword] = useState<string>('');

    useEffect(() => {
        const load = async () => {
            if (!user?.name) return;
            try {
                const u = await getUser(user.name);
                setEmail(u.email || '');
            } catch {
            }
        };
        load();
    }, [user?.name]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.name) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const updated = await updateUser(user.name, {
                email: email.trim() || null,
                old_password: newPassword ? oldPassword : undefined,
                new_password: newPassword || undefined,
            });
            setEmail(updated.email || '');
            setOldPassword('');
            setNewPassword('');
            setMessage('Profile updated successfully');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const data = error.response?.data as { detail?: string; message?: string } | undefined;
                const detail = data?.detail || data?.message || error.message;
                setError(status ? `Update failed (${status}): ${detail}` : `Update failed: ${detail}`);
            } else {
                setError('Update failed due to an unexpected error.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user?.name) return;
        if (!confirm('Delete your account permanently? This cannot be undone.')) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await deleteUser(user.name, deletePassword);
            logout();
            navigate('/register');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const data = error.response?.data as { detail?: string; message?: string } | undefined;
                const detail = data?.detail || data?.message || error.message;
                setError(status ? `Delete failed (${status}): ${detail}` : `Delete failed: ${detail}`);
            } else {
                setError('Delete failed due to an unexpected error.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-text-main">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-text-muted hover:text-text-main text-sm mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2 bg-surface rounded-xl border border-border">
                            <UserIcon className="w-6 h-6 text-text-muted" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                            <p className="text-text-muted text-sm">Manage your account details</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        {message && <p className="text-sm text-low bg-low/10 border border-low/30 rounded-lg px-4 py-2">{message}</p>}
                        {error && <p className="text-sm text-scam bg-scam/10 border border-scam/30 rounded-lg px-4 py-2">{error}</p>}

                        <section className="glass-panel rounded-2xl p-6 border border-border">
                            <h2 className="text-lg font-semibold mb-4">Account</h2>
                            <div className="space-y-4">
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input
                                        type="text"
                                        value={user?.name ?? ''}
                                        readOnly
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border text-text-main"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border text-text-main"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="glass-panel rounded-2xl p-6 border border-border">
                            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input
                                        type="password"
                                        placeholder="Current password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border text-text-main"
                                    />
                                </div>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input
                                        type="password"
                                        placeholder="New password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border text-text-main"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                Save changes
                            </button>
                        </div>
                    </form>

                    <section className="glass-panel rounded-2xl p-6 border border-border mt-8">
                        <h2 className="text-lg font-semibold mb-4 text-scam">Danger Zone</h2>
                        <div className="space-y-3">
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                <input
                                    type="password"
                                    placeholder="Password to confirm deletion"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border text-text-main"
                                />
                            </div>
                            <button
                                type="button"
                                disabled={loading || !deletePassword}
                                onClick={handleDelete}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-scam/10 text-scam border border-scam/20 font-bold hover:bg-scam hover:text-white disabled:opacity-50 disabled:bg-surface-muted disabled:text-text-muted transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete account
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
