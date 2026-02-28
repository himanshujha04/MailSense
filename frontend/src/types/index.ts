export interface Email {
    id: number;
    sender: string;
    subject: string;
    body: string;
    scam_label: string;
    scam_score: number;
    priority: string;
    folder: string;
    timestamp: string;
}

export interface AnalyticsData {
    total_emails: number;
    scam_count: number;
    legitimate_count: number;
    high_priority_count: number;
    medium_priority_count: number;
    low_priority_count: number;
}

export interface AutomationLog {
    id: number;
    email_id: number;
    action: string;
    timestamp: string;
}
