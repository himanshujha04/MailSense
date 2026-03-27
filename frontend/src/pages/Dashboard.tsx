import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getEmails, syncGmail, deleteEmail, getAutomationLogs, updateEmailFolder } from '../api/client';
import type { Email, AutomationLog } from '../types';
import { cleanBodyForDisplay } from '../utils/email';
import { Mail, Search, AlertTriangle, ShieldCheck, Zap, RefreshCw, Trash2, Bot, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const folderFilter = searchParams.get('folder') || 'inbox';
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const data = await getEmails();
                setEmails(data);
            } catch (error) {
                console.error("Failed to load emails:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const logs = await getAutomationLogs();
                setAutomationLogs(logs);
            } catch (_) {}
        };
        fetchLogs();
    }, [emails]);

    const handleSync = async () => {
        try {
            setLoading(true);
            const res = await syncGmail();
            const data = await getEmails();
            setEmails(data);
            alert(res.message); // Inform the user how many emails were synced
        } catch (error) {
            console.error("Failed to sync Gmail:", error);
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const detail =
                    (error.response?.data as any)?.detail ||
                    (error.response?.data as any)?.message ||
                    error.message;
                alert(status ? `Sync failed (${status}): ${detail}` : `Sync failed: ${detail}`);
            } else {
                alert("Failed to sync due to an unexpected error.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (emailId: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Delete this email?')) return;
        try {
            await deleteEmail(emailId);
            setEmails(prev => prev.filter(x => x.id !== emailId));
            if (selectedEmail?.id === emailId) setSelectedEmail(null);
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete email.");
        }
    };

    const handleMarkAsSpam = async (emailId: number) => {
        if (!confirm('Move this email to Spam?')) return;
        try {
            const updated = await updateEmailFolder(emailId, 'Spam');
            setEmails(prev => prev.map(e => e.id === emailId ? { ...e, folder: updated.folder, scam_label: updated.scam_label, scam_score: updated.scam_score } : e));
            if (selectedEmail?.id === emailId) setSelectedEmail(prev => prev ? { ...prev, folder: updated.folder, scam_label: updated.scam_label, scam_score: updated.scam_score } : null);
        } catch (error) {
            console.error("Failed to move to Spam:", error);
            alert("Failed to move to Spam.");
        }
    };

    const folderLower = folderFilter.toLowerCase();
    const folderFiltered =
        folderLower === 'urgent'
            ? emails.filter(e =>
                e.folder.toLowerCase() !== 'spam' && e.priority === 'High'
              )
            : emails.filter(e => e.folder.toLowerCase() === folderLower);
    const folderSorted =
        folderLower === 'urgent'
            ? [...folderFiltered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            : folderFiltered;
    const searchLower = searchQuery.trim().toLowerCase();
    const filteredEmails = searchLower
        ? folderSorted.filter(e =>
            e.sender.toLowerCase().includes(searchLower) ||
            e.subject.toLowerCase().includes(searchLower) ||
            cleanBodyForDisplay(e.body).toLowerCase().includes(searchLower)
        )
        : folderSorted;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            {/* Email List Panel */}
            <div className="w-[400px] border-r border-border bg-surface flex flex-col">
                <div className="h-20 px-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface backdrop-blur-md z-10 space-x-3">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-muted border border-border rounded-full py-2 pl-9 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent"
                        />
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className={clsx(
                            "p-2 shrink-0 bg-surface-muted text-text-main hover:bg-surface-muted/80 border border-border rounded-full transition-all disabled:opacity-50",
                            loading && "ring-2 ring-accent/30"
                        )}
                        title={loading ? "Syncing emails..." : "Sync latest emails (last 3 days)"}
                    >
                        <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="flex flex-col space-y-4 p-4 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-white/5 rounded-xl w-full" />
                            ))}
                        </div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm px-6 text-center">
                            <Mail className="w-12 h-12 mb-3 opacity-20" />
                            {folderLower === 'urgent' ? 'No urgent (high priority only) emails in Inbox/Archive.' : 'No emails found in this folder.'}
                        </div>
                    ) : (
                        filteredEmails.map(email => (
                            <button
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={clsx(
                                    "w-full text-left p-4 rounded-xl transition-all duration-200 border group",
                                    selectedEmail?.id === email.id
                                        ? "bg-surface-muted border-border"
                                        : "bg-surface border-border/50 hover:bg-surface-muted hover:border-border"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-sm truncate pr-2 text-text-main">{email.sender}</span>
                                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                                        {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                                    </span>
                                </div>
                                <h4 className="text-sm font-medium mb-2 truncate text-text-main">{email.subject}</h4>
                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs text-text-muted truncate pr-2 w-2/3">{cleanBodyForDisplay(email.body)}</p>
                                    <div className="flex items-center space-x-1 shrink-0">
                                        {email.scam_label === 'Scam' && <div className="w-2 h-2 rounded-full bg-scam" title="Scam Detected" />}
                                        {email.priority === 'High' && <div className="w-2 h-2 rounded-full bg-high" title="High Priority" />}
                                        <button
                                            onClick={(e) => handleDelete(email.id, e)}
                                            className="p-1 rounded hover:bg-scam/20 text-text-muted hover:text-scam"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Detail View Panel */}
            <main className="flex-1 bg-background relative overflow-hidden flex flex-col">

                {selectedEmail ? (
                    <div className="flex flex-col h-full animate-fade-in relative z-10 w-full max-w-4xl mx-auto p-8">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-surface-muted border border-border flex items-center justify-center text-xl font-bold text-text-main">
                                    {selectedEmail.sender.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-main">{selectedEmail.subject}</h2>
                                    <p className="text-text-muted text-sm">{selectedEmail.sender}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedEmail.folder.toLowerCase() !== 'spam' && (
                                    <button
                                        onClick={() => handleMarkAsSpam(selectedEmail.id)}
                                        className="p-2 rounded-lg border border-border text-text-muted hover:text-scam hover:border-scam/50 hover:bg-scam/10 transition-colors"
                                        title="Mark as Spam"
                                    >
                                        <ShieldAlert className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => selectedEmail && handleDelete(selectedEmail.id)}
                                    className="p-2 rounded-lg border border-border text-text-muted hover:text-scam hover:border-scam/50 hover:bg-scam/10 transition-colors"
                                    title="Delete email"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-text-muted">
                                    {new Date(selectedEmail.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-4 mb-8">
                            {/* Classification Tag */}
                            <div className={clsx(
                                "px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium border font-mono",
                                selectedEmail.scam_label === 'Scam'
                                    ? "bg-scam/10 border-scam/30 text-scam"
                                    : "bg-low/10 border-low/30 text-low"
                            )}>
                                {selectedEmail.scam_label === 'Scam' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                <span>
                                    {selectedEmail.scam_label} (
                                    {selectedEmail.scam_label === 'Scam'
                                        ? `${(selectedEmail.scam_score * 100).toFixed(0)}%`
                                        : `${(100 - selectedEmail.scam_score * 100).toFixed(0)}%`
                                    })
                                </span>
                            </div>

                            <div className={clsx(
                                "px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium border font-mono",
                                selectedEmail.priority === 'High' ? "bg-high/10 border-high/30 text-high" :
                                    selectedEmail.priority === 'Medium' ? "bg-surface-muted border-border text-text-muted" :
                                        "bg-surface-muted border-border text-text-muted"
                            )}>
                                <Zap className="w-4 h-4" />
                                <span>{selectedEmail.priority} Priority</span>
                            </div>
                        </div>

                        <div className="glass-panel rounded-2xl p-8 mb-8 flex-1 overflow-y-auto text-[15px] leading-relaxed relative">
                            <p className="whitespace-pre-wrap text-text-main">{cleanBodyForDisplay(selectedEmail.body)}</p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-border pb-4 space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">AI Automation Log (this email)</h3>
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface-muted border border-border font-mono text-xs text-text-main">
                                    <span className="text-text-muted italic">System: </span>
                                    <span>Detected '{selectedEmail.scam_label}' signature. Extracted {selectedEmail.priority} priority markers. Automatically routed to {selectedEmail.folder}.</span>
                                </div>
                            </div>
                            {automationLogs.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Bot className="w-3.5 h-3.5" /> RPA Automation Log (recent)
                                    </h3>
                                    <ul className="space-y-2 max-h-32 overflow-y-auto rounded-lg bg-surface-muted border border-border p-3 text-xs">
                                        {automationLogs.slice(0, 10).map((log) => (
                                            <li key={log.id} className="flex justify-between gap-2 text-text-main">
                                                <span className="truncate">Email #{log.email_id}: {log.action}</span>
                                                <span className="text-text-muted shrink-0">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 text-center animate-fade-in">
                        <div className="w-24 h-24 mb-6 rounded-3xl bg-surface border border-border flex items-center justify-center rotate-3">
                            <Mail className="w-10 h-10 -rotate-3 text-text-muted" />
                        </div>
                        <h2 className="text-xl font-medium text-text-main mb-2">Select a Conversation</h2>
                        <p className="max-w-xs text-sm text-text-muted">Choose an email from the left panel to read its contents and view AI classifications.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
