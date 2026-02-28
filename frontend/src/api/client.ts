import axios from 'axios';
import type { Email, AnalyticsData, AutomationLog } from '../types';

const API_URL = 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: API_URL,
});

export const getEmails = async (): Promise<Email[]> => {
    const response = await apiClient.get('/emails');
    return response.data;
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
    const response = await apiClient.get('/analytics');
    return response.data;
};

export const getAutomationLogs = async (): Promise<AutomationLog[]> => {
    const response = await apiClient.get('/automation_logs');
    return response.data;
};

export const deleteEmail = async (emailId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/emails/${emailId}`);
    return response.data;
};

export const updateEmailFolder = async (emailId: number, folder: string): Promise<Email> => {
    const response = await apiClient.patch(`/emails/${emailId}/folder?folder=${encodeURIComponent(folder)}`);
    return response.data;
};

export const login = async (username: string, password: string): Promise<{ success: boolean; user?: { name: string }; message?: string }> => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
};

export const register = async (username: string, email: string, password: string): Promise<{ success: boolean; user?: { name: string }; message?: string }> => {
    const response = await apiClient.post('/auth/register', { username, email: email || undefined, password });
    return response.data;
};

export const analyzeEmail = async (email: { sender: string; subject: string; body: string }): Promise<Email> => {
    const response = await apiClient.post('/analyze_email', email);
    return response.data;
};

export const syncGmail = async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/sync_gmail');
    return response.data;
};
