import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { getAnalytics } from '../api/client';
import type { AnalyticsData } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { FileBarChart2, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

export default function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await getAnalytics();
                setData(stats);
            } catch (error) {
                console.error("Failed to load analytics:", error);
            }
        };
        fetchStats();
    }, []);

    if (!data) return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin" />
            </div>
        </div>
    );

    const pieData = [
        { name: 'Legitimate', value: data.legitimate_count, color: '#10b981' },
        { name: 'Scam', value: data.scam_count, color: '#ef4444' },
    ];

    const barData = [
        { name: 'High', count: data.high_priority_count, color: '#f59e0b' },
        { name: 'Medium', count: data.medium_priority_count, color: '#3b82f6' },
        { name: 'Low', count: data.low_priority_count, color: '#10b981' },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto animate-fade-in relative">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-text-main mb-2 flex items-center">
                        <FileBarChart2 className="w-8 h-8 mr-3 text-text-muted" />
                        Security & Operations Metrics
                    </h1>
                    <p className="text-text-muted">Real-time analysis of the intelligent MailSense engine.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Total Processed"
                        value={data.total_emails}
                        icon={<FileBarChart2 className="w-6 h-6 text-text-muted" />}
                    />
                    <StatCard
                        title="Threats Isolated"
                        value={data.scam_count}
                        icon={<ShieldAlert className="w-6 h-6 text-scam" />}
                        trend="+12%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Clean Traffic"
                        value={data.legitimate_count}
                        icon={<CheckCircle2 className="w-6 h-6 text-low" />}
                    />
                    <StatCard
                        title="High Priority"
                        value={data.high_priority_count}
                        icon={<AlertTriangle className="w-6 h-6 text-high" />}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-panel p-6 rounded-2xl border border-border">
                        <h3 className="text-lg font-medium text-text-main mb-6">Threat Distribution Model</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                        itemStyle={{ color: 'var(--text-main)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center space-x-6 mt-4">
                            {pieData.map(item => (
                                <div key={item.name} className="flex items-center text-sm">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                    <span className="text-text-muted">{item.name}</span>
                                    <span className="ml-2 font-bold text-text-main">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-border">
                        <h3 className="text-lg font-medium text-text-main mb-6">Workflow Priority Queue</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'var(--surface-muted)' }}
                                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

type StatCardProps = {
    title: string;
    value: number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
};

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
    return (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group border border-border">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-surface-muted rounded-xl border border-border">
                    {icon}
                </div>
                {trend && (
                    <div className={clsx(
                        "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                        trendUp ? "text-scam bg-scam/10" : "text-low bg-low/10"
                    )}>
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
                <h4 className="text-4xl font-bold tracking-tight text-text-main">{value}</h4>
            </div>
        </div>
    );
}
