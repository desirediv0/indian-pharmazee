const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('partnerToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Auth APIs (no Bearer token — avoids stale partnerToken breaking login)
    async login(credentials) {
        const url = `${this.baseURL}/api/partner/auth/login`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        return data;
    }

    async changePassword(passwordData) {
        return this.request('/api/partner/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    async forgotPassword(email) {
        const url = `${this.baseURL}/api/partner/auth/forgot-password`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Request failed');
        return data;
    }

    async resetPassword(resetData) {
        const url = `${this.baseURL}/api/partner/auth/reset-password`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resetData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Request failed');
        return data;
    }

    async getProfile() {
        return this.request('/api/partner/profile');
    }

    // Coupon APIs
    async getCoupons() {
        return this.request('/api/partner/coupons');
    }

    // Earnings APIs
    async getEarnings(queryParams = '') {
        const url = queryParams ? `/api/partner/earnings?${queryParams}` : '/api/partner/earnings';
        return this.request(url);
    }

    async getEarningsStats(period = 'all') {
        return this.request(`/api/partner/earnings/stats?period=${period}`);
    }

    // Dashboard APIs
    async getDashboardStats() {
        return this.request('/api/partner/dashboard');
    }
}

export default new ApiService();
