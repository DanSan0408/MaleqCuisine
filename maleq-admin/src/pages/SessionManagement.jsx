import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SessionManagement() {
    const [sessions, setSessions] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [templateSaving, setTemplateSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        session_type: 'morning',
        start_time: '11:30',
        end_time: '13:00',
        max_orders: 8,
        current_orders: 0,
        date: new Date().toISOString().split('T')[0],
        is_active: true
    });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchSessions(), fetchTemplates()]);
            setError(null);
        } catch (err) {
            setError('Failed to load session data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/admin/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSessions(response.data.sessions || []);
        } catch (err) {
            console.error('Failed to load sessions', err);
            throw err;
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/admin/sessions/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTemplates(response.data.templates || []);
        } catch (err) {
            console.error('Failed to load templates', err);
            throw err;
        }
    };

    const getTemplateByType = (sessionType) => {
        const existing = templates.find((item) => item.session_type === sessionType);
        if (existing) return existing;

        if (sessionType === 'morning') {
            return { session_type: 'morning', start_time: '11:30', end_time: '13:00', max_orders: 8 };
        }

        return { session_type: 'evening', start_time: '14:00', end_time: '16:00', max_orders: 8 };
    };

    const handleTemplateChange = (sessionType, field, value) => {
        const fallback = getTemplateByType(sessionType);
        const normalized = field === 'max_orders' ? parseInt(value, 10) || 0 : value;

        setTemplates((prev) => {
            const hasTemplate = prev.some((item) => item.session_type === sessionType);
            if (!hasTemplate) {
                return [...prev, { ...fallback, [field]: normalized }];
            }

            return prev.map((item) => (
                item.session_type === sessionType
                    ? { ...item, [field]: normalized }
                    : item
            ));
        });
    };

    const handleTemplateSave = async (sessionType) => {
        const template = getTemplateByType(sessionType);

        if (!template.start_time || !template.end_time || !template.max_orders) {
            setError('Daily template requires start time, end time and max orders');
            return;
        }

        try {
            setTemplateSaving(true);
            await axios.put(
                `http://localhost:5000/api/admin/sessions/templates/${sessionType}`,
                {
                    start_time: template.start_time,
                    end_time: template.end_time,
                    max_orders: template.max_orders
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            await fetchAllData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save daily template');
        } finally {
            setTemplateSaving(false);
        }
    };

    const handleEnsureToday = async () => {
        try {
            await axios.post(
                'http://localhost:5000/api/admin/sessions/ensure-daily',
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            await fetchSessions();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to ensure today sessions');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingId) {
                await axios.put(
                    `http://localhost:5000/api/admin/sessions/${editingId}`,
                    formData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/admin/sessions',
                    formData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            }
            
            setFormData({
                session_type: 'morning',
                start_time: '11:30',
                end_time: '13:00',
                max_orders: 8,
                current_orders: 0,
                date: new Date().toISOString().split('T')[0],
                is_active: true
            });
            setEditingId(null);
            setShowForm(false);
            fetchSessions();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save session');
        }
    };

    const handleEdit = (session) => {
        setFormData(session);
        setEditingId(session.id);
        setShowForm(true);
    };

    const handleToggleStatus = async (sessionId, currentStatus) => {
        try {
            await axios.patch(
                `http://localhost:5000/api/admin/sessions/${sessionId}/toggle`,
                { is_active: !currentStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            fetchSessions();
        } catch (err) {
            setError('Failed to update session status');
        }
    };

    const handleResetCapacity = async (sessionId) => {
        if (window.confirm('Are you sure you want to reset the order count for this session?')) {
            try {
                await axios.patch(
                    `http://localhost:5000/api/admin/sessions/${sessionId}/reset-capacity`,
                    {},
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                fetchSessions();
            } catch (err) {
                setError('Failed to reset session capacity');
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            session_type: 'morning',
            start_time: '11:30',
            end_time: '13:00',
            max_orders: 8,
            current_orders: 0,
            date: new Date().toISOString().split('T')[0],
            is_active: true
        });
    };

    if (loading) {
        return <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-amber-300 bg-amber-50/50 p-6 space-y-4 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Everyday Default Sessions</h3>
                        <p className="text-sm text-slate-600 font-medium mt-1">These are automatically ensured every day for customer ordering.</p>
                    </div>
                    <button
                        onClick={handleEnsureToday}
                        className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                    >
                        Ensure Today Sessions
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['morning', 'evening'].map((sessionType) => {
                        const template = getTemplateByType(sessionType);
                        const title = sessionType === 'morning' ? '🌅 Morning' : '🌙 Evening';

                        return (
                            <div key={sessionType} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                                <h4 className="font-bold text-slate-900">{title}</h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label">Start</label>
                                        <input
                                            type="time"
                                            value={template.start_time}
                                            onChange={(e) => handleTemplateChange(sessionType, 'start_time', e.target.value)}
                                            className="input bg-slate-50 border-transparent focus:border-orange-500 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">End</label>
                                        <input
                                            type="time"
                                            value={template.end_time}
                                            onChange={(e) => handleTemplateChange(sessionType, 'end_time', e.target.value)}
                                            className="input bg-slate-50 border-transparent focus:border-orange-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Max Orders</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={template.max_orders}
                                        onChange={(e) => handleTemplateChange(sessionType, 'max_orders', e.target.value)}
                                        className="input bg-slate-50 border-transparent focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <button
                                    onClick={() => handleTemplateSave(sessionType)}
                                    disabled={templateSaving}
                                    className="btn-base w-full justify-center bg-slate-900 text-white hover:bg-amber-700 disabled:opacity-50"
                                >
                                    Save {title} Default
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Delivery Sessions</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                >
                    {showForm ? '✕ Cancel' : '+ Create Session'}
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-slate-900">
                        {editingId ? 'Edit Delivery Session' : 'Create New Delivery Session'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Session Type *</label>
                                <select
                                    name="session_type"
                                    value={formData.session_type}
                                    onChange={handleInputChange}
                                    required
                                    className="input bg-white"
                                >
                                    <option value="morning">🌅 Morning</option>
                                    <option value="evening">🌙 Evening</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Date *</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    className="input bg-white"
                                />
                            </div>

                            <div>
                                <label className="label">Start Time *</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleInputChange}
                                    required
                                    className="input bg-white"
                                />
                            </div>

                            <div>
                                <label className="label">End Time *</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleInputChange}
                                    required
                                    className="input bg-white"
                                />
                            </div>

                            <div>
                                <label className="label">Max Orders *</label>
                                <input
                                    type="number"
                                    name="max_orders"
                                    value={formData.max_orders}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
                                    className="input bg-white"
                                />
                            </div>

                            <div>
                                <label className="label">Current Orders</label>
                                <input
                                    type="number"
                                    name="current_orders"
                                    value={formData.current_orders}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="input bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
                            />
                            <label className="text-sm font-semibold text-slate-700">Open for Orders</label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                            >
                                {editingId ? 'Update Session' : 'Create Session'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up stagger-1">
                {sessions.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                            <span className="text-2xl">📅</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">No delivery sessions</p>
                        <p className="mt-1 text-sm text-slate-500">Create a new session or ensure today's defaults.</p>
                    </div>
                ) : (
                    sessions.map(session => {
                        const capacityPercent = (session.current_orders / session.max_orders) * 100;
                        const isFull = session.current_orders >= session.max_orders;
                        
                        return (
                            <div key={session.id} className="card flex flex-col transition hover:border-amber-300">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900">
                                            {session.session_type === 'morning' ? '🌅' : '🌙'} {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)}
                                        </h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">{session.date}</p>
                                        <p className="text-sm font-bold text-slate-700">{session.start_time} - {session.end_time}</p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        session.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {session.is_active ? 'Open' : 'Closed'}
                                    </span>
                                </div>

                                {/* Capacity */}
                                <div className="mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold text-slate-600 text-sm">Capacity</span>
                                        <span className={`font-bold text-sm ${isFull && session.is_active ? 'text-red-600' : 'text-slate-900'}`}>
                                            {session.current_orders} / {session.max_orders}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition ${
                                                isFull ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Status Note */}
                                {isFull && session.is_active && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 mb-4 text-sm text-amber-800">
                                        ⚠️ Session is at full capacity
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-2 mt-auto pt-2">
                                    <button
                                        onClick={() => handleToggleStatus(session.id, session.is_active)}
                                        className={`btn-base w-full justify-center text-white ${
                                            session.is_active
                                                ? 'bg-red-500 hover:bg-red-600 border border-transparent'
                                                : 'bg-green-600 hover:bg-green-700 border border-transparent'
                                        }`}
                                    >
                                        {session.is_active ? '🔒 Close Session' : '🔓 Open Session'}
                                    </button>

                                    <button
                                        onClick={() => handleResetCapacity(session.id)}
                                        className="btn-base w-full justify-center border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                                    >
                                        🔄 Reset Orders
                                    </button>

                                    <button
                                        onClick={() => handleEdit(session)}
                                        className="btn-base w-full justify-center bg-slate-900 text-white hover:bg-amber-700"
                                    >
                                        ✎ Edit Session
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
