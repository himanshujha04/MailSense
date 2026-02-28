import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, Sun, Moon, ArrowLeft } from 'lucide-react';

export default function Preferences() {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

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
                            <Settings className="w-6 h-6 text-text-muted" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
                            <p className="text-text-muted text-sm">Customize your MailSense experience</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="glass-panel rounded-2xl p-6 border border-border">
                            <h2 className="text-lg font-semibold mb-1">Appearance</h2>
                            <p className="text-text-muted text-sm mb-6">Choose how MailSense looks.</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Light mode</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTheme('light')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                            theme === 'light'
                                                ? 'bg-surface-muted border-border text-text-main'
                                                : 'border-border text-text-muted hover:bg-surface-muted'
                                        }`}
                                    >
                                        <Sun className="w-4 h-4" />
                                        Light
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTheme('dark')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                            theme === 'dark'
                                                ? 'bg-surface-muted border-border text-text-main'
                                                : 'border-border text-text-muted hover:bg-surface-muted'
                                        }`}
                                    >
                                        <Moon className="w-4 h-4" />
                                        Dark
                                    </button>
                                </div>
                            </div>
                            <p className="text-text-muted text-xs mt-4">
                                Dark mode is the default minimal black & white theme. Light mode uses a light background.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
