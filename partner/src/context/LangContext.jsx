import React, { createContext, useContext, useState } from 'react';

const translations = {
    en: {
        // Navigation
        nav_dashboard: 'Dashboard',
        nav_coupons: 'My Coupons',
        nav_earnings: 'Earnings',
        nav_profile: 'Profile',
        nav_logout: 'Logout',

        // Dashboard
        welcome: 'Welcome back',
        dashboard_subtitle: "Here's an overview of your partnership performance with Genuine Grocery.",
        total_commission: 'Total Commission Earned',
        this_month: 'This Month',
        last_month: 'Last Month Revenue',
        total_coupons: 'Total Coupons',
        total_order_value: 'Total Order Value',
        commission_rate: 'Commission Rate',
        monthly_summary: 'Monthly Earnings Summary',
        month_col: 'Month',
        commissions_col: 'Commissions',
        earned_col: 'Total Earned',
        status_col: 'Payment Status',
        current_month_badge: 'Current',
        recent_orders: 'Recent Orders',
        no_orders: 'No recent orders found',
        no_orders_desc: 'Orders will appear here once customers use your coupons',
        partner_info: 'Partner Information',
        contact_details: 'Contact Details',
        account_status: 'Account Status',
        email_label: 'Email:',
        name_label: 'Name:',
        partner_id: 'Partner ID:',
        status_label: 'Status:',
        active_partner: 'Active Partner',
        member_since: 'Member since:',

        // Coupons
        coupons_title: 'My Coupons',
        coupons_desc: 'Manage your assigned coupon codes and track performance',
        coupon_code: 'Coupon Code',
        discount: 'Discount',
        commission_label: 'Commission',
        your_commission: 'Your Commission',
        orders_count: 'Orders',
        earned: 'Earned',
        status_active: 'Active',
        status_inactive: 'Inactive',
        no_coupons: 'No coupons assigned yet',
        no_coupons_desc: 'Contact your manager to get coupon codes assigned.',

        // Earnings
        earnings_title: 'Earnings Dashboard',
        earnings_desc: 'Track your commissions and payment status',
        total_earnings: 'Total Earnings',
        pending_payments: 'Pending Payments',
        total_commissions: 'Total Commissions',
        filter_by: 'Filter by:',
        all_years: 'All Years',
        all_months: 'All Months',
        export_csv: 'Export CSV',
        monthly_payment_status: 'Monthly Payment Status',
        detailed_earnings: 'Detailed Earnings',
        date_col: 'Date',
        order_id_col: 'Order ID',
        product_col: 'Product',
        commission_col: 'Commission',
        no_earnings: 'No earnings found',
        no_earnings_desc: 'No commission earnings available for the selected period.',
        paid: 'PAID',
        pending: 'PENDING',

        // Login
        login_title: 'Partner Portal',
        login_subtitle: 'Sign in to your partner account',
        email_placeholder: 'Email address',
        password_placeholder: 'Password',
        login_btn: 'Sign In',
        logging_in: 'Signing in...',
        forgot_password: 'Forgot password?',
        login_error: 'Invalid email or password',
        become_partner: 'Want to become a partner?',
        apply_link: 'Apply Here',

        // Common
        loading: 'Loading...',
        error: 'Error',
        refresh: 'Refresh',
        orders: 'orders',
        lang_toggle: 'हिन्दी',
    },
    hi: {
        // Navigation
        nav_dashboard: 'डैशबोर्ड',
        nav_coupons: 'मेरे कूपन',
        nav_earnings: 'कमाई',
        nav_profile: 'प्रोफाइल',
        nav_logout: 'लॉगआउट',

        // Dashboard
        welcome: 'वापसी पर स्वागत',
        dashboard_subtitle: 'Genuine Grocery के साथ आपकी पार्टनरशिप का सारांश',
        total_commission: 'कुल कमीशन',
        this_month: 'इस महीने',
        last_month: 'पिछले महीने की कमाई',
        total_coupons: 'कुल कूपन',
        total_order_value: 'कुल ऑर्डर मूल्य',
        commission_rate: 'कमीशन दर',
        monthly_summary: 'मासिक कमाई सारांश',
        month_col: 'महीना',
        commissions_col: 'कमीशन',
        earned_col: 'कुल कमाई',
        status_col: 'भुगतान स्थिति',
        current_month_badge: 'चालू',
        recent_orders: 'हाल के ऑर्डर',
        no_orders: 'कोई हाल के ऑर्डर नहीं',
        no_orders_desc: 'जब ग्राहक आपके कूपन का उपयोग करेंगे तो ऑर्डर यहाँ दिखेंगे',
        partner_info: 'पार्टनर जानकारी',
        contact_details: 'संपर्क विवरण',
        account_status: 'खाता स्थिति',
        email_label: 'ईमेल:',
        name_label: 'नाम:',
        partner_id: 'पार्टनर ID:',
        status_label: 'स्थिति:',
        active_partner: 'सक्रिय पार्टनर',
        member_since: 'सदस्यता:',

        // Coupons
        coupons_title: 'मेरे कूपन',
        coupons_desc: 'अपने कूपन कोड प्रबंधित करें और प्रदर्शन ट्रैक करें',
        coupon_code: 'कूपन कोड',
        discount: 'छूट',
        commission_label: 'कमीशन',
        your_commission: 'आपका कमीशन',
        orders_count: 'ऑर्डर',
        earned: 'कमाई',
        status_active: 'सक्रिय',
        status_inactive: 'निष्क्रिय',
        no_coupons: 'अभी कोई कूपन नहीं दिया गया',
        no_coupons_desc: 'कूपन कोड पाने के लिए अपने मैनेजर से संपर्क करें।',

        // Earnings
        earnings_title: 'कमाई डैशबोर्ड',
        earnings_desc: 'अपने कमीशन और भुगतान स्थिति को ट्रैक करें',
        total_earnings: 'कुल कमाई',
        pending_payments: 'बकाया भुगतान',
        total_commissions: 'कुल कमीशन',
        filter_by: 'फ़िल्टर करें:',
        all_years: 'सभी वर्ष',
        all_months: 'सभी महीने',
        export_csv: 'CSV डाउनलोड',
        monthly_payment_status: 'मासिक भुगतान स्थिति',
        detailed_earnings: 'विस्तृत कमाई',
        date_col: 'तारीख',
        order_id_col: 'ऑर्डर ID',
        product_col: 'उत्पाद',
        commission_col: 'कमीशन',
        no_earnings: 'कोई कमाई नहीं मिली',
        no_earnings_desc: 'चयनित अवधि के लिए कोई कमीशन उपलब्ध नहीं।',
        paid: 'भुगतान हो गया',
        pending: 'बकाया',

        // Login
        login_title: 'पार्टनर पोर्टल',
        login_subtitle: 'अपने पार्टनर खाते में साइन इन करें',
        email_placeholder: 'ईमेल पता',
        password_placeholder: 'पासवर्ड',
        login_btn: 'साइन इन',
        logging_in: 'साइन इन हो रहा है...',
        forgot_password: 'पासवर्ड भूल गए?',
        login_error: 'अमान्य ईमेल या पासवर्ड',
        become_partner: 'पार्टनर बनना चाहते हैं?',
        apply_link: 'यहाँ आवेदन करें',

        // Common
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        refresh: 'रिफ्रेश',
        orders: 'ऑर्डर',
        lang_toggle: 'English',
    }
};

const LangContext = createContext(null);

export const LangProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        try {
            return localStorage.getItem('partnerLang') || 'en';
        } catch {
            return 'en';
        }
    });

    const toggleLang = () => {
        const newLang = lang === 'en' ? 'hi' : 'en';
        setLang(newLang);
        try { localStorage.setItem('partnerLang', newLang); } catch {}
    };

    const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

    return (
        <LangContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LangContext.Provider>
    );
};

export const useLang = () => {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error('useLang must be used within LangProvider');
    return ctx;
};
