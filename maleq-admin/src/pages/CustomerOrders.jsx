import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { OrderContext } from '../context/OrderContext';

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

export default function CustomerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { setCurrentStep } = useContext(OrderContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserOrders = async () => {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            const phone = localStorage.getItem('lastOrderPhone');
            
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // 1. Fetch authenticated orders directly linked to the user account
                const authResponse = await axios.get('http://localhost:5000/api/orders/user-orders', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                let fetchedOrders = authResponse.data.orders || [];

                // 2. Fetch by phone as a fallback to catch orders made before account linking or as a guest
                if (phone) {
                    try {
                        const phoneResponse = await axios.post('http://localhost:5000/api/orders/track/by-phone', {
                            phone: phone.trim()
                        });
                        const phoneOrders = phoneResponse.data.orders || [];
                        
                        // Merge and deduplicate by order ID
                        const orderMap = new Map();
                        fetchedOrders.forEach(o => orderMap.set(o.id, o));
                        phoneOrders.forEach(o => orderMap.set(o.id, o));
                        
                        fetchedOrders = Array.from(orderMap.values());
                        
                        // Sort descending by created_at
                        fetchedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    } catch (phoneErr) {
                        console.warn('Fallback phone fetch failed:', phoneErr);
                    }
                }

                setOrders(fetchedOrders);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load your orders');
            } finally {
                setLoading(false);
            }
        };

        fetchUserOrders();
    }, [navigate]);

    if (loading) {
        return (
            <Layout pageTitle="My Orders">
                <div className="card-elevated p-8">
                    <div className="animate-pulse">
                        <div className="h-4 w-3/4 rounded-full bg-slate-200 mb-3" />
                        <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout pageTitle="My Orders">
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            {orders.length === 0 && !error ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                        <span className="text-2xl">🧾</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Nothing here yet</p>
                    <p className="mt-1 text-sm text-slate-500">You have no previous orders.</p>
                    <Link to="/customer/order" onClick={() => setCurrentStep('type')} className="mt-4 btn-base bg-orange-500 text-white hover:bg-orange-600">
                        Start Ordering
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white card-elevated">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Payment</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Track</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b border-slate-50 transition hover:bg-amber-50/50">
                                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{order.order_number}</td>
                                    <td className="px-4 py-4 text-sm capitalize text-slate-700">{order.order_type.replace('_', ' ')}</td>
                                    <td className="px-4 py-4 text-sm text-slate-700">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                            {order.statusLabel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-700">{formatDate(order.created_at)}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-slate-900">KD {Number(order.total).toFixed(2)}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="font-bold capitalize text-slate-900">{order.payment_method ? order.payment_method.replace('_', ' ') : 'Cash'}</span>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                                order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                order.payment_status === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                                                order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {(order.payment_status || 'Pending').replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-700">
                                        <Link
                                            to={order.tracking_token ? `/track-order/${order.tracking_token}` : '/track-order'}
                                            className="btn-base border border-amber-300 bg-amber-50 text-amber-800 transition hover:border-amber-500 hover:bg-amber-100"
                                        >
                                            Track
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
}