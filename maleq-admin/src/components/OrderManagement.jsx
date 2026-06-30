import { useEffect, useState } from 'react';
import axios from 'axios';

const ORDER_STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    preparing: 'bg-blue-100 text-blue-800 border border-blue-200',
    ready: 'bg-green-100 text-green-800 border border-green-200',
    completed: 'bg-slate-100 text-slate-700 border border-slate-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200'
};

function formatDate(value) {
    return new Date(value).toLocaleString();
}

export default function OrderManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingOrderId, setSavingOrderId] = useState(null);
    const [deletingOrderId, setDeletingOrderId] = useState(null);
    const [authFailed, setAuthFailed] = useState(false);
    const [refreshEnabled, setRefreshEnabled] = useState(true);

    const getAuthToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');

    const loadOrders = async () => {
        try {
            const token = getAuthToken();

            if (!token) {
                setAuthFailed(true);
                setError('Session missing. Please sign in again.');
                setOrders([]);
                return;
            }

            const response = await axios.get('http://localhost:5000/api/admin/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setOrders(response.data.orders || []);
            setError('');
            setAuthFailed(false);
        } catch (fetchError) {
            const message = fetchError.response?.data?.message || 'Failed to load orders';
            setError(message);

            if (fetchError.response?.status === 401 || fetchError.response?.status === 403) {
                setAuthFailed(true);
                setRefreshEnabled(false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        if (!refreshEnabled) {
            return undefined;
        }

        const interval = setInterval(loadOrders, 5000);

        return () => clearInterval(interval);
    }, [refreshEnabled]);

    const updateStatus = async (orderId, status) => {
        try {
            setSavingOrderId(orderId);
            const token = getAuthToken();
            await axios.patch(
                `http://localhost:5000/api/admin/orders/${orderId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await loadOrders();
        } catch (updateError) {
            setError(updateError.response?.data?.message || 'Failed to update order status');
        } finally {
            setSavingOrderId(null);
        }
    };

    const getNextStatus = (order) => {
        if (order.status === 'pending') {
            return 'preparing';
        }

        if (order.status === 'preparing') {
            return 'ready';
        }

        if (order.status === 'ready' && order.order_type === 'dine_in') {
            return 'completed';
        }

        return null;
    };

    const getStatusButtonLabel = (order) => {
        if (order.status === 'pending') {
            return 'Set preparing';
        }

        if (order.status === 'preparing') {
            if (order.order_type === 'delivery') {
                return 'Set on the way';
            }

            if (order.order_type === 'pickup') {
                return 'Set ready for pickup';
            }

            return 'Set ready for dine in';
        }

        if (order.status === 'ready' && order.order_type === 'dine_in') {
            return 'Set served';
        }

        return null;
    };

    const handleDeleteOrder = async (orderId) => {
        const confirmed = window.confirm('Delete this order? This will remove it from the admin board and database.');
        if (!confirmed) {
            return;
        }

        try {
            setDeletingOrderId(orderId);
            const token = getAuthToken();
            await axios.delete(`http://localhost:5000/api/admin/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await loadOrders();
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || 'Failed to delete order');
        } finally {
            setDeletingOrderId(null);
        }
    };

    if (loading) {
        return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600 animate-pulse">Loading live orders...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Live operations</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Order Tracking Board</h3>
                    <p className="mt-2 text-sm text-slate-600 font-medium">Update orders from pending to preparing, ready, and final completion.</p>
                </div>
                <button
                    onClick={loadOrders}
                    className="btn-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            {authFailed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Admin session is not valid for the order board. Log out and sign in again as an admin or superadmin.
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Table / Location</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const nextStatus = getNextStatus(order);
                                const nextLabel = getStatusButtonLabel(order);

                                return (
                                    <tr key={order.id} className="border-b border-slate-50 transition hover:bg-amber-50/50">
                                        <td className="px-4 py-4 align-top text-sm font-semibold text-slate-900">#{order.order_number}</td>
                                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                                            <div className="font-bold text-slate-900">{order.customer_name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{order.customer_phone}</div>
                                        </td>
                                        <td className="px-4 py-4 align-top text-sm text-slate-700 capitalize">{order.order_type.replace('_', ' ')}</td>
                                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                                            {order.order_type === 'dine_in' ? (
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {order.dine_in_time && (
                                                        <span className="font-semibold text-slate-900 flex items-center gap-1">
                                                            ⏱️ {order.dine_in_time}
                                                        </span>
                                                    )}
                                                    {order.dine_in_pax && (
                                                        <span className="text-slate-600 flex items-center gap-1">
                                                            👥 {order.dine_in_pax} Pax
                                                        </span>
                                                    )}
                                                    {order.table_number && (
                                                        <span className="font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 w-fit mt-0.5" title="Table Preference / Request">
                                                            Pref: {order.table_number}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : order.table_number ? (
                                                <span className="font-semibold text-slate-900">Table {order.table_number}</span>
                                            ) : order.delivery_address ? (
                                                <span>{order.delivery_address}</span>
                                            ) : order.branch_id ? (
                                                <span>Branch #{order.branch_id}</span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                                            <div className="flex flex-col gap-2">
                                                {nextStatus && nextLabel ? (
                                                    <button
                                                        disabled={savingOrderId === order.id}
                                                        onClick={() => updateStatus(order.id, nextStatus)}
                                                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                            order.status === 'pending'
                                                                ? 'bg-slate-900 hover:bg-amber-700'
                                                                : order.order_type === 'dine_in' && order.status === 'ready'
                                                                    ? 'bg-orange-500 hover:bg-orange-600'
                                                                    : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                        title={nextLabel}
                                                    >
                                                        {order.statusLabel}
                                                    </button>
                                                ) : (
                                                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${ORDER_STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700'}`}>
                                                        {order.statusLabel}
                                                    </span>
                                                )}
                                                {nextStatus && nextLabel ? (
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Click status to {nextLabel.toLowerCase()}
                                                    </span>
                                                ) : (
                                                    <span className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                                                        {order.order_type === 'delivery' && order.status === 'ready'
                                                            ? 'Waiting for customer to confirm delivery'
                                                            : order.order_type === 'pickup' && order.status === 'ready'
                                                                ? 'Waiting for customer to confirm pickup'
                                                                : 'No further status change'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-top text-sm text-slate-700">{formatDate(order.created_at)}</td>
                                        <td className="px-4 py-4 align-top text-sm font-bold text-slate-900">KD {Number(order.total).toFixed(2)}</td>
                                        <td className="px-4 py-4 align-top">
                                            <button
                                                disabled={deletingOrderId === order.id}
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="btn-base px-3 py-1.5 text-xs border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {orders.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                            <span className="text-2xl">🧾</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">No active orders</p>
                        <p className="mt-1 text-sm text-slate-500">When customers place orders, they will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}