import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return `${API_BASE}${path}`;
    return path;
};

export default function PaymentManagement() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Payment Settings State
    const [paymentSettings, setPaymentSettings] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ image_file: null, image_preview: '' });

    // Pending Verifications State
    const [pendingOrders, setPendingOrders] = useState([]);
    const [verifyingOrderId, setVerifyingOrderId] = useState(null);

    // Payment Logs State
    const [paymentLogs, setPaymentLogs] = useState([]);

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settingsRes, pendingRes, logsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/payment/settings`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/api/payment/orders/pending-verifications`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/api/payment/orders/logs`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (settingsRes.data.settings) {
                setPaymentSettings(settingsRes.data.settings);
            }
            setPendingOrders(pendingRes.data.orders || []);
            setPaymentLogs(logsRes.data.logs || []);
        } catch (err) {
            console.error('Failed to fetch payment data', err);
            setError('Failed to fetch payment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Optional: auto-refresh pending orders
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [token]);

    const handlePaymentImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentForm({
                    ...paymentForm,
                    image_file: file,
                    image_preview: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdatePaymentSettings = async (e) => {
        e.preventDefault();
        if (!paymentForm.image_file) {
            setError('Please select a QR code image to upload');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('image', paymentForm.image_file);

            await axios.put(`${API_BASE}/api/payment/settings`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Payment settings updated successfully');
            setPaymentForm({ image_file: null, image_preview: '' });
            setTimeout(() => setSuccess(''), 5000);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update payment settings');
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (orderId) => {
        const confirmed = window.confirm('Verify this payment? This will mark the order as paid.');
        if (!confirmed) return;

        try {
            setVerifyingOrderId(orderId);
            await axios.put(`${API_BASE}/api/payment/orders/${orderId}/verify-payment`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Payment for order #${orderId} verified successfully`);
            setTimeout(() => setSuccess(''), 3000);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify payment');
            setTimeout(() => setError(''), 5000);
        } finally {
            setVerifyingOrderId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Payment Management</h2>
                <p className="text-sm font-medium text-slate-600 mt-2">Manage your QR Pay settings and manually verify uploaded customer receipts.</p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Verifications */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>⏳</span> Pending Verifications ({pendingOrders.length})
                    </h3>
                    
                    {pendingOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                            <span className="text-4xl mb-4">✅</span>
                            <p className="text-sm font-bold text-slate-900">All caught up!</p>
                            <p className="text-xs text-slate-500 mt-1">No pending payments to verify.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingOrders.map(order => (
                                <div key={order.id} className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-slate-900">Order #{order.order_number || order.id}</p>
                                            <p className="text-sm text-slate-700">{order.customer_name} ({order.customer_phone})</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-amber-900">KD {Number(order.total).toFixed(2)}</p>
                                            <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3">
                                        <div className="w-full flex justify-center bg-white rounded-xl border border-amber-100 p-2">
                                            <a href={getImageUrl(order.payment_receipt_url)} target="_blank" rel="noopener noreferrer" className="w-full">
                                                <img 
                                                    src={getImageUrl(order.payment_receipt_url)} 
                                                    alt="Receipt" 
                                                    className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition cursor-pointer"
                                                    title="Click to view full size"
                                                />
                                            </a>
                                        </div>
                                        
                                        <button
                                            disabled={verifyingOrderId === order.id}
                                            onClick={() => handleVerifyPayment(order.id)}
                                            className="w-full btn-base justify-center bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {verifyingOrderId === order.id ? 'Verifying...' : 'Verify Payment'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* QR Code Settings */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>📱</span> QR Pay Settings
                    </h3>
                    
                    <form onSubmit={handleUpdatePaymentSettings} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <div>
                            <label className="label">Upload QR Code Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePaymentImageChange}
                                className="input bg-white"
                            />
                            <p className="text-xs text-slate-500 mt-2 font-medium">This QR code will be displayed to customers when they select QR Pay during checkout.</p>
                            {paymentForm.image_preview && (
                                <img
                                    src={getImageUrl(paymentForm.image_preview)}
                                    alt="QR preview"
                                    className="mt-3 h-48 w-auto rounded-2xl object-cover shadow-sm mx-auto"
                                />
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !paymentForm.image_file}
                            className="btn-base bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 w-full justify-center"
                        >
                            {loading ? 'Uploading...' : 'Save QR Code'}
                        </button>
                    </form>

                    {paymentSettings && paymentSettings.qr_code_url && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Current Active QR Code</h4>
                            <img 
                                src={getImageUrl(paymentSettings.qr_code_url)} 
                                alt="Current QR Code" 
                                className="h-64 w-auto rounded-xl object-contain border border-slate-100 p-2 mx-auto bg-slate-50" 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Logs Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>📋</span> Payment Logs
                </h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-medium">No completed payment logs found.</td>
                                </tr>
                            ) : (
                                paymentLogs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">#{log.order_number || log.id}</td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{log.customer_name} <br/><span className="text-xs text-slate-500">{log.customer_phone}</span></td>
                                        <td className="px-4 py-4 text-sm font-bold text-slate-900">KD {Number(log.total).toFixed(2)}</td>
                                        <td className="px-4 py-4 text-sm capitalize text-slate-700">{(log.payment_method || '').replace('_', ' ')}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                log.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                log.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {(log.payment_status || '').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600">{new Date(log.updated_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
