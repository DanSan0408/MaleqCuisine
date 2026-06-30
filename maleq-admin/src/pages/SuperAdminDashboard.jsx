import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function CrownIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="m4 9 4.5 3 3-6 3 6L20 9l-2 10H6L4 9Z" fill="currentColor" />
        </svg>
    );
}

export default function SuperAdminDashboard() {
    const [admins, setAdmins] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return navigate('/login');

                const response = await axios.get('http://localhost:5000/api/superadmin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAdmins(response.data.admins);
            } catch (error) {
                console.error(error);
                navigate('/login');
            }
        };
        fetchDashboardData();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
                <header className="rounded-3xl bg-slate-900 px-6 py-6 text-white shadow-xl sm:px-8 z-20 sticky top-4">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
                                <CrownIcon /> Superadmin control room
                            </span>
                            <h2 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">Superadmin Dashboard</h2>
                            <p className="text-sm leading-6 text-slate-300 font-medium sm:text-base">
                                Oversee the admin team, review the live directory, and keep the management layer organized.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/superadmin/add-admin"
                                className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                            >
                                + Add New Admin
                            </Link>
                            <Link
                                to="/login"
                                className="btn-base border border-white/30 bg-transparent text-white hover:bg-white/10"
                            >
                                Back to login
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="card">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Access</p>
                        <p className="mt-2 text-3xl font-black">Management</p>
                        <p className="mt-2 text-sm font-medium text-slate-600">Central place for team oversight and control.</p>
                    </div>
                    <div className="card">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Admins</p>
                        <p className="mt-2 text-3xl font-black">{admins.length}</p>
                        <p className="mt-2 text-sm font-medium text-slate-600">Current active admin records loaded below.</p>
                    </div>
                    <div className="card">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Status</p>
                        <p className="mt-2 text-3xl font-black">Live</p>
                        <p className="mt-2 text-sm font-medium text-slate-600">Fresh data pulled from the backend on load.</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mt-2">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
                        <div>
                            <h3 className="text-xl font-black tracking-tight">Current Admins</h3>
                            <p className="mt-1 text-sm text-slate-500">A clean view of the admin roster and account creation dates.</p>
                        </div>
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-600">
                            {admins.length} total
                        </span>
                    </div>

                    <div className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="border-b border-slate-50 transition hover:bg-amber-50/50">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">#{admin.id}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{admin.email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(admin.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}