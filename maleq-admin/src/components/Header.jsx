import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function UserAvatarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="currentColor" opacity="0.9" />
            <path d="M4 20c1.8-3.5 4.8-5 8-5s6.2 1.5 8 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export default function Header({ pageTitle = 'Dashboard' }) {
    const navigate = useNavigate();
    const [avatarOpen, setAvatarOpen] = useState(false);

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isAuthenticated = Boolean(token);

    const authLabel = useMemo(() => {
        if (role === 'superadmin') return 'Superadmin';
        if (role === 'admin') return 'Admin';
        if (role === 'customer') return 'Customer';
        return 'Guest';
    }, [role]);

    const handleLogout = () => {
        localStorage.clear();
        setAvatarOpen(false);
        navigate('/customer/dashboard');
    };

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/70 bg-white/90 px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6 lg:px-10">
            {/* LEFT: Brand + Page title */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
                    Maleq Cuisine
                </p>
                <h1 className="mt-1 font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    {pageTitle}
                </h1>
            </div>

            {/* CENTER: Desktop nav */}
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
                <Link to="/customer/dashboard" className="transition hover:text-amber-700">Home</Link>
                <Link to="/customer/story" className="transition hover:text-amber-700">Our Story</Link>
            </nav>

            {/* RIGHT: Action buttons + Auth */}
            <div className="relative flex items-center gap-3 text-sm font-semibold">
                <Link to="/track-order" className="hidden btn-base border border-amber-300 bg-amber-50 text-amber-800 transition hover:border-amber-500 hover:bg-amber-100 md:inline-flex">
                    Track order
                </Link>
                {isAuthenticated && (
                    <Link to="/customer/orders" className="hidden btn-base border border-slate-200 bg-white text-slate-700 transition hover:border-amber-500 hover:text-amber-700 md:inline-flex">
                        My orders
                    </Link>
                )}
                <Link to="/customer/order" className="hidden btn-base bg-orange-500 text-white transition hover:bg-orange-600 md:inline-flex">
                    Start Ordering
                </Link>

                {isAuthenticated ? (
                    <>
                        <button onClick={() => setAvatarOpen(!avatarOpen)} className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition hover:border-amber-500 hover:text-amber-700">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-inner">
                                <UserAvatarIcon />
                            </span>
                            <span className="hidden sm:block">{authLabel}</span>
                        </button>

                        {avatarOpen && (
                            <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                                <div className="border-b border-slate-100 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Signed in</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900">{authLabel} account</p>
                                    <p className="mt-1 text-xs text-slate-500">Access is ready for this session.</p>
                                </div>
                                <Link to="/track-order" className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800 md:hidden">Track order</Link>
                                <Link to="/customer/orders" className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800 md:hidden">My orders</Link>
                                <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800">
                                    Log out
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Link to="/track-order" className="btn-base border border-amber-300 bg-amber-50 text-amber-800 transition hover:border-amber-500 hover:bg-amber-100 md:hidden">Track</Link>
                        <Link to="/customer/order" className="btn-base bg-orange-500 text-white transition hover:bg-orange-600 md:hidden">Order</Link>
                        <Link to="/login" className="hidden btn-base border border-slate-200 bg-white text-slate-700 transition hover:border-amber-500 hover:text-amber-700 sm:inline-flex">Login</Link>
                        <Link to="/register" className="hidden btn-base bg-slate-900 text-white transition hover:bg-amber-700 sm:inline-flex">Register</Link>
                    </>
                )}
            </div>
        </header>
    );
}