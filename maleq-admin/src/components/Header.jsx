import React, { useMemo, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderContext } from '../context/OrderContext';

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
    const { setCurrentStep } = useContext(OrderContext);
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
        <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
            <header className="flex items-center justify-between gap-4 rounded-full border-2 border-white/60 bg-white/75 px-6 py-3 shadow-[0_8px_32px_rgba(245,118,0,0.1)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_16px_48px_rgba(245,118,0,0.15)] hover:bg-white/90">
                {/* LEFT: Brand + Page title */}
            <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[#DE4F02]">
                    Maleq Cuisine
                </p>
                <h1 className="mt-1 font-display text-xl font-black tracking-tight text-slate-800 sm:text-2xl drop-shadow-sm">
                    {pageTitle}
                </h1>
            </div>

            {/* CENTER: Desktop nav */}
            <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
                <Link to="/customer/dashboard" className="transition hover:text-[#F57600] hover:-translate-y-0.5">Home</Link>
                <Link to="/customer/story" className="transition hover:text-[#F57600] hover:-translate-y-0.5">Our Story</Link>
            </nav>

            {/* RIGHT: Action buttons + Auth */}
            <div className="relative flex items-center gap-3 text-sm font-bold">
                <Link to="/track-order" className="hidden btn-base rounded-full border-2 border-[#FFE77A] bg-[#FFE77A]/20 text-[#DE4F02] transition-all hover:border-[#F57600] hover:bg-[#FFE77A]/50 hover:-translate-y-0.5 md:inline-flex shadow-sm">
                    Track order
                </Link>
                {isAuthenticated && (
                    <Link to="/customer/orders" className="hidden btn-base rounded-full border-2 border-slate-200 bg-white text-slate-700 transition-all hover:border-[#FF9633] hover:text-[#DE4F02] hover:-translate-y-0.5 md:inline-flex shadow-sm">
                        My orders
                    </Link>
                )}
                <Link to="/customer/order" onClick={() => setCurrentStep('type')} className="hidden btn-base rounded-full bg-gradient-to-r from-[#FF9633] to-[#F57600] text-white transition-all hover:from-[#F57600] hover:to-[#DE4F02] hover:-translate-y-0.5 hover:shadow-md md:inline-flex shadow-sm">
                    Start Ordering
                </Link>

                {isAuthenticated ? (
                    <>
                        <button onClick={() => setAvatarOpen(!avatarOpen)} className="flex items-center gap-3 rounded-full border-2 border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition-all hover:border-[#FF9633] hover:text-[#DE4F02] hover:-translate-y-0.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9633] to-[#F57600] text-white shadow-inner">
                                <UserAvatarIcon />
                            </span>
                            <span className="hidden sm:block font-bold">{authLabel}</span>
                        </button>

                        {avatarOpen && (
                            <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                                <div className="border-b border-slate-100 px-4 py-4 bg-[#FFE77A]/10">
                                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#DE4F02]">Signed in</p>
                                    <p className="mt-1 text-sm font-black text-slate-800">{authLabel} account</p>
                                    <p className="mt-1 text-xs text-slate-500 font-medium">Access is ready for this session.</p>
                                </div>
                                <Link to="/track-order" className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-[#FFE77A]/20 hover:text-[#DE4F02] md:hidden">Track order</Link>
                                <Link to="/customer/orders" className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-[#FFE77A]/20 hover:text-[#DE4F02] md:hidden">My orders</Link>
                                <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-[#FFE77A]/20 hover:text-[#DE4F02]">
                                    Log out
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Link to="/track-order" className="btn-base rounded-full border-2 border-[#FFE77A] bg-[#FFE77A]/20 text-[#DE4F02] transition hover:border-[#F57600] hover:bg-[#FFE77A]/50 md:hidden">Track</Link>
                        <Link to="/customer/order" onClick={() => setCurrentStep('type')} className="btn-base rounded-full bg-gradient-to-r from-[#FF9633] to-[#F57600] text-white transition hover:from-[#F57600] hover:to-[#DE4F02] md:hidden">Order</Link>
                        <Link to="/login" className="hidden btn-base rounded-full border-2 border-slate-200 bg-white text-slate-700 transition hover:border-[#FF9633] hover:text-[#DE4F02] hover:-translate-y-0.5 sm:inline-flex">Login</Link>
                        <Link to="/register" className="hidden btn-base rounded-full bg-gradient-to-r from-[#FF9633] to-[#F57600] text-white transition hover:from-[#F57600] hover:to-[#DE4F02] hover:-translate-y-0.5 hover:shadow-md sm:inline-flex">Register</Link>
                    </>
                )}
            </div>
        </header>
        </div>
    );
}