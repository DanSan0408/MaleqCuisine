import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import MenuManagement from './MenuManagement';
import RestaurantManagement from './RestaurantManagement';
import SessionManagement from './SessionManagement';
import DashboardDesigner from './DashboardDesigner';
import DashboardSections from '../components/DashboardSections';
import OrderManagement from '../components/OrderManagement';

function ChefHatIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M7 9a5 5 0 1 1 10 0 4 4 0 0 1-4 4H11a4 4 0 0 1-4-4Z" fill="currentColor" />
            <path d="M8 13h8v6H8v-6Z" fill="currentColor" opacity="0.85" />
        </svg>
    );
}

export default function AdminDashboard() {
    const [coAdmins, setCoAdmins] = useState([]);
    const [activeTab, setActiveTab] = useState('preview');
    const [editingSection, setEditingSection] = useState(null);
    const navigate = useNavigate();
    const getAuthToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = getAuthToken();
                if (!token) return navigate('/login');

                const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoAdmins(response.data.admins);
            } catch (error) {
                console.error("Dashboard error:", error);
                alert("Session expired or unauthorized. Please login again.");
                localStorage.clear();
                navigate('/login');
            }
        };
        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const tabs = [
        { id: 'preview', label: '👁️ Preview', icon: '👁️' },
        { id: 'designer', label: '🎨 Designer', icon: '🎨' },
        { id: 'team', label: '👥 Team', icon: '👥' },
        { id: 'menu', label: '🍽️ Menu', icon: '🍽️' },
        { id: 'orders', label: '🧾 Orders', icon: '🧾' },
        { id: 'restaurants', label: '🏪 Restaurants', icon: '🏪' },
        { id: 'sessions', label: '📅 Sessions', icon: '📅' }
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
                {/* Header */}
                <header className="card-elevated px-6 py-6 sm:px-8 bg-white/90 backdrop-blur z-20 sticky top-4">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-800">
                                <ChefHatIcon /> Team operations
                            </span>
                            <h2 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Admin Dashboard</h2>
                            <p className="text-sm leading-6 text-slate-600 font-medium sm:text-base">
                                Manage menus, restaurants, delivery sessions, and team operations.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/admin/invite"
                                className="btn-base bg-slate-900 text-white hover:bg-amber-700"
                            >
                                + Invite Admin
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="btn-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Tabs Navigation */}
                <div className="rounded-t-3xl border border-b-0 border-slate-200 bg-white overflow-hidden">
                    <nav className="flex gap-1 px-4 sm:px-6 overflow-x-auto bg-slate-50" role="tablist">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-orange-500 text-amber-800 bg-white'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <section className="rounded-b-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                    {/* Preview Tab - Live Preview of Customer Dashboard */}
                    {activeTab === 'preview' && (
                        <div className="space-y-8">
                            <div className="max-w-3xl space-y-2">
                                <h3 className="font-display text-2xl font-black tracking-tight text-slate-900">Live Customer Dashboard Preview</h3>
                                <p className="text-slate-600">This is exactly what customers see. Click the Edit buttons below to modify each section.</p>
                            </div>
                            <DashboardSections 
                                editable={true}
                                onEditSlideshow={() => {
                                    setActiveTab('designer');
                                    setEditingSection('slideshow');
                                }}
                                onEditStory={() => {
                                    setActiveTab('designer');
                                    setEditingSection('story');
                                }}
                            />
                        </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            <section className="grid gap-4 sm:grid-cols-3">
                                <div className="card bg-slate-50 border-slate-200">
                                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Team</p>
                                    <p className="mt-2 text-3xl font-black text-slate-900">{coAdmins.length}</p>
                                    <p className="mt-2 text-sm font-medium text-slate-600">Admins in directory</p>
                                </div>
                                <div className="card bg-slate-50 border-slate-200">
                                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Role</p>
                                    <p className="mt-2 text-3xl font-black text-slate-900">Admin</p>
                                    <p className="mt-2 text-sm font-medium text-slate-600">Full access</p>
                                </div>
                                <div className="card bg-slate-50 border-slate-200">
                                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Status</p>
                                    <p className="mt-2 text-3xl font-black text-slate-900">Online</p>
                                    <p className="mt-2 text-sm font-medium text-slate-600">Active session</p>
                                </div>
                            </section>

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coAdmins.map((admin) => (
                                            <tr key={admin.id} className="border-b border-slate-50 transition hover:bg-amber-50/50">
                                                <td className="px-4 py-4 text-sm font-semibold text-slate-900">#{admin.id}</td>
                                                <td className="px-4 py-4 text-sm font-bold text-slate-900">{admin.email}</td>
                                                <td className="px-4 py-4 text-sm text-slate-600">{new Date(admin.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Menu Tab */}
                    {activeTab === 'menu' && <MenuManagement />}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && <OrderManagement />}

                    {/* Dashboard Designer Tab */}
                    {activeTab === 'designer' && <DashboardDesigner initialTab={editingSection} />}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && <RestaurantManagement />}

                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && <SessionManagement />}
                </section>
            </div>
        </div>
    );
}