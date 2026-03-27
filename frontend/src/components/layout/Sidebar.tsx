import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Inbox, ShieldAlert, Archive, LogOut, Settings, Sun, Moon, ChevronDown, Zap, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [prefsOpen, setPrefsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setPrefsOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    const navItems = [
        { name: 'Inbox', icon: <Inbox className="w-5 h-5" />, path: '/' },
        { name: 'Urgent', icon: <Zap className="w-5 h-5" />, path: '/?folder=urgent' },
        { name: 'Spam', icon: <ShieldAlert className="w-5 h-5" />, path: '/?folder=spam' },
        { name: 'Archive', icon: <Archive className="w-5 h-5" />, path: '/?folder=archive' },
        { name: 'Profile', icon: <UserIcon className="w-5 h-5" />, path: '/profile' },
    ];

    return (
        <aside className="w-64 h-screen border-r border-border bg-surface flex flex-col pt-6 pb-4">
            <div className="px-6 mb-8 flex items-center space-x-3">
                <div className="p-2 bg-surface-muted rounded-xl border border-border">
                    <ShieldAlert className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-text-main">MailSense AI</h1>
                    <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">{user?.name ?? 'Workspace'}</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm group relative",
                                isActive
                                    ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                                    : "text-text-muted hover:text-text-main hover:bg-surface-muted/50"
                            )
                        }
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 mt-auto space-y-2 border-t border-border pt-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setPrefsOpen(!prefsOpen)}
                        className={clsx(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-semibold",
                            prefsOpen ? "bg-accent/10 text-accent ring-1 ring-accent/20" : "text-text-muted hover:text-text-main hover:bg-surface-muted/50"
                        )}
                    >
                        <span className="flex items-center space-x-3">
                            <Settings className="w-5 h-5" />
                            <span>Preferences</span>
                        </span>
                        <ChevronDown className={clsx("w-4 h-4 transition-transform", prefsOpen && "rotate-180")} />
                    </button>
                    {prefsOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 py-2 bg-surface border border-border rounded-xl shadow-lg z-50">
                            <p className="px-4 py-2 text-xs font-bold text-text-muted uppercase tracking-wider">Theme</p>
                            <button
                                type="button"
                                onClick={() => { setTheme('light'); setPrefsOpen(false); }}
                                className={clsx("w-full flex items-center space-x-3 px-4 py-2.5 text-sm", theme === 'light' ? "bg-surface-muted text-text-main" : "text-text-muted hover:bg-surface-muted/50")}
                            >
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button
                                type="button"
                                onClick={() => { setTheme('dark'); setPrefsOpen(false); }}
                                className={clsx("w-full flex items-center space-x-3 px-4 py-2.5 text-sm", theme === 'dark' ? "bg-surface-muted text-text-main" : "text-text-muted hover:bg-surface-muted/50")}
                            >
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                        </div>
                    )}
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-text-muted hover:text-white hover:bg-scam transition-all text-sm font-semibold border border-transparent hover:border-scam/20 group"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
