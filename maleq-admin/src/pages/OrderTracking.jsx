import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    preparing: 'bg-blue-100 text-blue-800 border border-blue-200',
    ready: 'bg-green-100 text-green-800 border border-green-200',
    completed: 'bg-slate-100 text-slate-700 border border-slate-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200'
};

export default function OrderTracking() {
    const { trackingToken } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [notice, setNotice] = useState('');
    const [phone, setPhone] = useState(localStorage.getItem('lastOrderPhone') || '');
    const [lookingUp, setLookingUp] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const hasOrderToken = Boolean(trackingToken);

    const loadOrder = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/orders/track/${trackingToken}`);
            setOrder(response.data.order);
            setError('');
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'Failed to load order tracking');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!trackingToken) {
            setLoading(false);
            return undefined;
        }

        loadOrder();
        const interval = setInterval(loadOrder, 4000);

        return () => clearInterval(interval);
    }, [trackingToken]);

    const handleLookupSubmit = async (event) => {
        event.preventDefault();

        if (!phone.trim()) {
            setError('Please enter your phone number');
            return;
        }

        try {
            setLookingUp(true);
            setError('');
            setHasSearched(true);

            const response = await axios.post('http://localhost:5000/api/orders/track/by-phone', {
                phone: phone.trim()
            });

            setOrders(response.data.orders || []);
            localStorage.setItem('lastOrderPhone', phone.trim());
        } catch (lookupError) {
            setError(lookupError.response?.data?.message || 'Could not find orders for this phone number');
            setOrders([]);
        } finally {
            setLookingUp(false);
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setConfirming(true);
            setNotice('');
            const action = order.order_type === 'pickup' ? 'picked_up' : 'received';
            const response = await axios.patch(`http://localhost:5000/api/orders/track/${trackingToken}/confirm`, { action });
            setOrder(response.data.order);
            setNotice('Your order confirmation has been saved.');
        } catch (confirmError) {
            setError(confirmError.response?.data?.message || 'Failed to confirm order');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_45%,_#ffffff_100%)] px-4 py-10 text-slate-900">
                <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur">
                    Loading live order tracking...
                </div>
            </div>
        );
    }

    if (!hasOrderToken) {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_45%,_#ffffff_100%)] px-4 py-10 text-slate-900">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Order recovery</p>
                        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Find your orders</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Enter the phone number used at checkout to see every order linked to it.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLookupSubmit} className="grid gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                                placeholder="Phone used at checkout"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={lookingUp}
                            className="rounded-2xl bg-slate-950 px-4 py-3.5 font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {lookingUp ? 'Finding order...' : 'Find order'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/customer/dashboard')}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-700 transition hover:border-amber-500 hover:text-amber-700"
                        >
                            Back to home
                        </button>
                    </form>

                {orders.length === 0 && hasSearched && !error && !lookingUp && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                        No active orders found for {phone}.
                    </div>
                )}

                    {orders.length > 0 && (
                        <div className="space-y-4 pt-2">
                            {orders.map((trackedOrder) => (
                                <div key={trackedOrder.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Order {trackedOrder.order_number}</p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {trackedOrder.customer_name} · {trackedOrder.order_type.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${STATUS_STYLES[trackedOrder.status] || 'bg-slate-100 text-slate-800'}`}>
                                            {trackedOrder.statusLabel}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <Link
                                            to={trackedOrder.tracking_token ? `/track-order/${trackedOrder.tracking_token}` : '/track-order'}
                                            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                                        >
                                            Open live tracking
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_45%,_#ffffff_100%)] px-4 py-10 text-slate-900">
                <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Order tracking</p>
                    <h1 className="mt-3 text-3xl font-black">Unable to load this order</h1>
                    <p className="mt-3 text-slate-600">{error}</p>
                    <button
                        onClick={() => navigate('/customer/dashboard')}
                        className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_45%,_#ffffff_100%)] px-4 py-10 text-slate-900">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <header className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Live order tracking</p>
                            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Order {order.order_number}</h1>
                            <p className="mt-2 text-slate-600">
                                {order.customer_name} · {order.order_type.replace('_', ' ')}
                                {order.order_type === 'dine_in' && order.dine_in_time && (
                                    <>
                                        {' · '}⏱️ {order.dine_in_time} (Guests: {order.dine_in_pax})
                                    </>
                                )}
                            </p>
                        </div>
                        <div className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-800'}`}>
                            {order.statusLabel}
                        </div>
                    </div>
                </header>

                {notice && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {notice}
                    </div>
                )}

                <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Current status</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-900">{order.statusLabel}</h2>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {order.statusTimeline?.map((step) => (
                                    <div
                                        key={step.key}
                                        className={`rounded-3xl border px-4 py-4 ${step.active ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
                                    >
                                        <p className="text-sm font-semibold text-slate-800">{step.label}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                                            {step.current ? 'Current' : step.completed ? 'Completed' : 'Pending'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-3xl bg-slate-50 p-5">
                                <p className="text-sm font-semibold text-slate-800">Items</p>
                                <ul className="mt-3 space-y-3">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="flex items-start justify-between gap-4 text-sm text-slate-600">
                                            <span>{item.quantity} × {item.name}</span>
                                            <span className="font-semibold text-slate-900">KD {(Number(item.price) * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Customer actions</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900">What happens next</h2>

                        <div className="mt-4 space-y-4 text-sm text-slate-600">
                            {order.order_type === 'dine_in' && (
                                <>
                                    <p><span className="font-semibold text-slate-900">⏱️ Booking Time:</span> {order.dine_in_time}</p>
                                    <p><span className="font-semibold text-slate-900">👥 Number of Guests:</span> {order.dine_in_pax} Pax</p>
                                    {order.table_number && (
                                        <p><span className="font-semibold text-slate-900">🪑 Table Preference:</span> {order.table_number}</p>
                                    )}
                                </>
                            )}
                            <p><span className="font-semibold text-slate-900">Ready label:</span> {order.readyLabel}</p>
                            <p><span className="font-semibold text-slate-900">Completion label:</span> {order.completionLabel}</p>
                            <p><span className="font-semibold text-slate-900">Payment:</span> Skipped for now. Order is saved without payment.</p>
                        </div>

                        {order.canCustomerConfirm ? (
                            <button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {confirming ? 'Saving confirmation...' : order.customerActionLabel}
                            </button>
                        ) : (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                {order.canAdminComplete ? 'Waiting for staff to mark this order as served.' : 'This order updates automatically as the kitchen changes status.'}
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/customer/dashboard')}
                            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-500 hover:text-amber-700"
                        >
                            Back to home
                        </button>
                    </aside>
                </section>
            </div>
        </div>
    );
}