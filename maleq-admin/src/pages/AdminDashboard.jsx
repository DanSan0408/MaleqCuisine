import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import MenuManagement from './MenuManagement';
import RestaurantManagement from './RestaurantManagement';
import SessionManagement from './SessionManagement';
import DashboardDesigner from './DashboardDesigner';
import DashboardSections from '../components/DashboardSections';
import OrderManagement from '../components/OrderManagement';
import PaymentManagement from './PaymentManagement';
import InviteAdmin from './InviteAdmin';

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
    const [showInviteForm, setShowInviteForm] = useState(false);
    const navigate = useNavigate();
    const getAuthToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');

    const fetchDashboardData = useCallback(async () => {
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
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const tabs = [
        { id: 'preview', label: 'Preview', icon: '👁️' },
        { id: 'designer', label: 'Designer', icon: '🎨' },
        { id: 'team', label: 'Team', icon: '👥' },
        { id: 'menu', label: 'Menu', icon: '🍽️' },
        { id: 'orders', label: 'Orders', icon: '🧾' },
        { id: 'payment', label: 'Payment', icon: '💳' },
        { id: 'restaurants', label: 'Restaurants', icon: '🏪' },
        { id: 'sessions', label: 'Sessions', icon: '📅' }
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] pl-[10px] pr-4 py-6 text-slate-900 sm:pr-6 lg:pr-8 lg:py-8">
            <div className="flex min-h-[calc(100vh-3rem)] w-full flex-col lg:flex-row gap-6">
                
                {/* Sidebar */}
                <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] z-30">
                    <div className="card-elevated bg-white/90 backdrop-blur p-5 flex flex-col h-full rounded-3xl border border-slate-200">
                        <div className="mb-6 px-3 pt-2">
                            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900">Maleq</h1>
                        </div>
                        
                        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto px-1" role="tablist">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition text-left ${
                                        activeTab === tab.id
                                            ? 'bg-amber-100/50 text-amber-900 border border-amber-200/50 shadow-sm'
                                            : 'border border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                >
                                    <span className="text-xl">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="flex flex-col gap-3 pt-6 px-1 mt-auto border-t border-slate-100">
                            <button
                                onClick={handleLogout}
                                className="btn-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700 w-full justify-center"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    {/* Header */}
                    <header className="card-elevated px-6 py-8 sm:px-10 bg-white/90 backdrop-blur z-20 rounded-3xl border border-slate-200">
                        <div className="max-w-3xl space-y-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-800">
                                <ChefHatIcon /> Team operations
                            </span>
                            <h2 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Admin Dashboard</h2>
                            <p className="text-sm leading-relaxed text-slate-600 font-medium sm:text-base">
                                Manage menus, restaurants, delivery sessions, and team operations.
                            </p>
                        </div>
                    </header>

                    {/* Tab Content */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm flex-1 mb-8">
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
                            {showInviteForm ? (
                                <InviteAdmin onCancel={(success) => {
                                    setShowInviteForm(false);
                                    if (success) {
                                        fetchDashboardData();
                                    }
                                }} />
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-display text-2xl font-black tracking-tight text-slate-900">Team Directory</h3>
                                        <button
                                            onClick={() => setShowInviteForm(true)}
                                            className="btn-base bg-slate-900 text-white hover:bg-amber-700"
                                        >
                                            + Invite Admin
                                        </button>
                                    </div>
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
                                </>
                            )}
                        </div>
                    )}

                    {/* Menu Tab */}
                    {activeTab === 'menu' && <MenuManagement />}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && <OrderManagement />}

                    {/* Payment Tab */}
                    {activeTab === 'payment' && <PaymentManagement />}

                    {/* Dashboard Designer Tab */}
                    {activeTab === 'designer' && <DashboardDesigner initialTab={editingSection} />}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && <RestaurantManagement />}

                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && <SessionManagement />}
                </section>
                </div>
            </div>
        </div>
    );
}