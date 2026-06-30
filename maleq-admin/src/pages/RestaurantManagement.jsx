import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RestaurantManagement() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        is_active: true
    });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/branches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBranches(response.data.branches || []);
            setError(null);
        } catch (err) {
            setError('Failed to load branches');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingId) {
                await axios.put(
                    `http://localhost:5000/api/admin/branches/${editingId}`,
                    formData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/admin/branches',
                    formData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            }
            
            setFormData({
                name: '',
                address: '',
                latitude: '',
                longitude: '',
                phone: '',
                is_active: true
            });
            setEditingId(null);
            setShowForm(false);
            fetchBranches();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save branch');
        }
    };

    const handleEdit = (branch) => {
        setFormData(branch);
        setEditingId(branch.id);
        setShowForm(true);
    };

    const handleDelete = async (branchId) => {
        if (window.confirm('Are you sure you want to delete this branch?')) {
            try {
                await axios.delete(
                    `http://localhost:5000/api/admin/branches/${branchId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                fetchBranches();
            } catch (err) {
                setError('Failed to delete branch');
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            name: '',
            address: '',
            latitude: '',
            longitude: '',
            phone: '',
            is_active: true
        });
    };

    if (loading) {
        return <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Restaurant Branches</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                >
                    {showForm ? '✕ Cancel' : '+ Add Branch'}
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
                        {editingId ? 'Edit Branch' : 'Add New Branch'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Branch Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Restaurant branch name"
                                    required
                                    className="input bg-white"
                                />
                            </div>

                            <div>
                                <label className="label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+965-XXXX-XXXX"
                                    className="input bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Address *</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Full branch address"
                                required
                                className="input bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Latitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleInputChange}
                                    placeholder="29.3759"
                                    className="input bg-white"
                                />
                                <p className="text-xs text-slate-500 font-medium mt-1">For map display</p>
                            </div>

                            <div>
                                <label className="label">Longitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleInputChange}
                                    placeholder="47.9774"
                                    className="input bg-white"
                                />
                                <p className="text-xs text-slate-500 font-medium mt-1">For map display</p>
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
                            <label className="text-sm font-semibold text-slate-700">Active</label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                            >
                                {editingId ? 'Update Branch' : 'Add Branch'}
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

            {/* Branches Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-fade-in-up stagger-1">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Branch Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                                            <span className="text-2xl">🏪</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">No branches found</p>
                                        <p className="mt-1 text-sm text-slate-500">Add a new restaurant branch to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            branches.map(branch => (
                                <tr key={branch.id} className="border-b border-slate-50 transition hover:bg-amber-50/50">
                                    <td className="px-6 py-4 font-bold text-slate-900">📍 {branch.name}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">{branch.address}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{branch.phone || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {branch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-2">
                                        <button
                                            onClick={() => handleEdit(branch)}
                                            className="btn-base px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(branch.id)}
                                            className="btn-base px-3 py-1.5 text-xs border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
