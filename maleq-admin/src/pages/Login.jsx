import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginHeroIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-amber-300" aria-hidden="true">
            <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" fill="currentColor" />
            <path d="M4 20c1.9-3.7 5.2-5.5 8-5.5S16.1 16.3 18 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            
            // Extract token and role from the backend response
            const { accessToken, role } = response.data;
            
            // Save token to localStorage for both the legacy and current key names.
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('token', accessToken);
            localStorage.setItem('role', role); // Helpful to store the role too

            // Redirect based on the user's role
            if (role === 'superadmin') {
                navigate('/superadmin/dashboard');
            } else if (role === 'admin') {
                navigate('/admin/dashboard');
            } else if (role === 'customer') {
                navigate('/customer/dashboard');
            } else {
                alert("Unknown user role!");
            }

        } catch (error) {
            alert(error.response?.data?.message || "Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white sm:px-10 lg:px-12 lg:py-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.28),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(251,146,60,0.18),_transparent_36%)]" />
                    <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
                                <LoginHeroIcon /> Secure access
                            </span>
                            <div className="max-w-xl space-y-4">
                                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                                    Welcome back to Maleq Cuisine.
                                </h1>
                                <p className="text-base leading-7 text-slate-200 sm:text-lg">
                                    Sign in to manage your role, unlock your dashboard, and continue right where you left off.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <p className="text-3xl font-black text-amber-300">01</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">Fast login for customers and staff.</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <p className="text-3xl font-black text-amber-300">02</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">Role-based routing to the right page.</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <p className="text-3xl font-black text-amber-300">03</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">Optional customer registration if needed.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="flex items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
                    <div className="w-full max-w-md">
                        <button
                            type="button"
                            onClick={() => navigate('/customer/dashboard')}
                            className="btn-base mb-6 border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                        >
                            ← Back to Home
                        </button>

                        <div className="mb-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Sign In</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Access your dashboard</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Use your email and password to continue.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="input"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-base w-full justify-center bg-slate-900 text-white hover:bg-amber-700 py-3 text-base mt-2"
                            >
                                Log In
                            </button>
                        </form>

                        <p className="mt-6 text-sm text-slate-600">
                            Don’t have an account? <Link to="/register" className="font-semibold text-amber-700 hover:underline">Register here</Link>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}