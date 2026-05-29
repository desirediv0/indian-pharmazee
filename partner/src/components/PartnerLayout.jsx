import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    Home,
    Ticket,
    DollarSign,
    LogOut,
    Menu,
    X,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/context/LangContext';

const PartnerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout } = useAuth();
    const { t, toggleLang, lang } = useLang();

    const navigation = [
        { name: t('nav_dashboard'), href: '/', icon: Home },
        { name: t('nav_coupons'), href: '/coupons', icon: Ticket },
        { name: t('nav_earnings'), href: '/earnings', icon: IndianRupee },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="h-screen flex bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#DE7A3E] to-[#7596DB] shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-orange-400">
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-white">Genuine Grocery</h1>
                                <p className="text-xs text-orange-100">Partner Portal</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-white hover:bg-orange-400"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive
                                            ? 'bg-white text-orange-600 shadow-md'
                                            : 'text-orange-100 hover:bg-orange-400 hover:text-white'
                                        }
                  `}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Language Toggle + Logout */}
                    <div className="px-4 py-6 border-t border-orange-400 space-y-2">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLang}
                            className="w-full flex items-center px-4 py-2 text-sm font-medium text-orange-100 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Globe className="h-5 w-5 mr-3" />
                            {lang === 'en' ? 'हिन्दी' : 'English'}
                        </button>

                        <Button
                            variant="ghost"
                            className="w-full justify-start text-orange-100 hover:text-white hover:bg-red-600"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            {t('nav_logout')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                {/* Top bar */}
                <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 lg:px-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-gray-600 hover:text-gray-900"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{t('welcome')}!</span>{' '}
                            {lang === 'en' ? "Let's grow your business together." : 'आपके बिज़नेस को बढ़ाएं।'}
                        </div>
                    </div>

                    {/* Top-bar language toggle (visible on desktop) */}
                    <button
                        onClick={toggleLang}
                        className="hidden lg:flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-orange-100 hover:text-orange-600 transition-colors rounded-full px-3 py-1.5 font-medium"
                    >
                        <Globe className="h-3.5 w-3.5" />
                        {lang === 'en' ? 'हिन्दी' : 'English'}
                    </button>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PartnerLayout;
