import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CustomerRegister() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                email,
                password
            });

            const { accessToken, role } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('role', role);

            navigate('/customer/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] px-6 py-10 text-slate-900">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid lg:grid-cols-[1fr_0.9fr]">
                <section className="flex flex-col justify-between bg-slate-950 p-8 text-white lg:p-10">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">Maleq Cuisine</p>
                        <h1 className="mt-4 max-w-md text-4xl font-black leading-tight tracking-tight lg:text-5xl">
                            Create a customer account if you want a faster repeat experience.
                        </h1>
                        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
                            Registration is optional. Guests can still browse the public dashboard, but a customer account keeps your details and future orders easier to manage.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:mt-0">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-2xl font-black text-amber-300">Guest</p>
                            <p className="mt-2 text-sm text-slate-300">Browse without signing in.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-2xl font-black text-amber-300">Fast</p>
                            <p className="mt-2 text-sm text-slate-300">Save details for checkout.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-2xl font-black text-amber-300">Live</p>
                            <p className="mt-2 text-sm text-slate-300">Stay ready for ordering.</p>
                        </div>
                    </div>
                </section>

                <section className="flex items-center p-8 lg:p-10">
                    <div className="w-full max-w-md">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Customer Sign Up</p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight">Register your customer account</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            You can still use the dashboard without an account, but this saves your login for next time.
                        </p>

                        <form onSubmit={handleRegister} className="mt-8 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                                <input
                                    type="password"
                                    placeholder="Choose a secure password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    className="input"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-base w-full justify-center bg-slate-900 text-white hover:bg-amber-700 py-3 text-base mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-3">
                            <p className="text-sm text-slate-600">
                                Already have an account? <Link to="/login" className="font-semibold text-amber-700 hover:underline">Login here</Link>
                            </p>
                            <div className="flex gap-3">
                                <Link to="/customer/dashboard" className="btn-base flex-1 justify-center border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700 py-3">Return to home</Link>
                                <Link to="/" className="btn-base flex-1 justify-center bg-slate-900 text-white hover:bg-amber-700 py-3">Public site</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}