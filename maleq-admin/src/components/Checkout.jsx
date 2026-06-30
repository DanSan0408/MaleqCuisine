import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderContext } from '../context/OrderContext';
import Cart from './Cart';
import axios from 'axios';

export default function Checkout() {
    const {
        orderType,
        customerInfo,
        setCustomerInfo,
        deliveryAddress,
        setDeliveryAddress,
        deliverySessionId,
        selectedBranch,
        tableNumber,
        dineInTime,
        dineInPax,
        cart,
        calculateSubtotal,
        calculateTotal,
        resetOrder,
        setCurrentStep
    } = useContext(OrderContext);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleInputChange = (field, value) => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!customerInfo.name.trim()) {
            setError('Please enter your name');
            return false;
        }
        if (!customerInfo.phone.trim()) {
            setError('Please enter your phone number');
            return false;
        }
        if (cart.length === 0) {
            setError('Your cart is empty');
            return false;
        }
        if (orderType === 'delivery' && !deliveryAddress.trim()) {
            setError('Please enter your delivery address');
            return false;
        }
        return true;
    };

    const handleSubmitOrder = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            setError(null);

            const token = localStorage.getItem('accessToken');

            const orderData = {
                orderType,
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone,
                customerEmail: customerInfo.email || null,
                items: cart.map(item => ({ menu_item_id: item.id, quantity: item.quantity })),
                deliverySessionId: orderType === 'delivery' ? deliverySessionId : null,
                deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
                branchId: orderType === 'pickup' ? selectedBranch : null,
                tableNumber: orderType === 'dine_in' ? tableNumber : null,
                dineInTime: orderType === 'dine_in' ? dineInTime : null,
                dineInPax: orderType === 'dine_in' ? dineInPax : null
            };

            const headers = {
                'Content-Type': 'application/json'
            };

            // Add authorization header if user is logged in
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(
                'http://localhost:5000/api/orders/create',
                orderData,
                { headers }
            );

            if (response.data.success) {
                localStorage.setItem('lastOrderId', String(response.data.orderId));
                localStorage.setItem('lastOrderPhone', customerInfo.phone.trim());

                resetOrder();

                if (response.data.trackingToken) {
                    localStorage.setItem('lastOrderTrackingToken', response.data.trackingToken);
                    navigate(`/track-order/${response.data.trackingToken}`, { replace: true });
                } else {
                    navigate('/customer/dashboard', { replace: true });
                    alert('Order placed successfully, but live tracking is not available until the tracking token column is added to the orders table.');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Checkout</h2>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* Customer Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Customer Information</h3>

                    <div>
                        <label className="label">Full Name *</label>
                        <input
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your full name"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Phone Number *</label>
                        <input
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Email Address (Optional)</label>
                        <input
                            type="email"
                            value={customerInfo.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email address"
                            className="input"
                        />
                    </div>

                    {orderType === 'delivery' && (
                        <div>
                            <label className="label">Delivery Address *</label>
                            <textarea
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="Enter your delivery address"
                                className="input resize-none"
                                rows="4"
                            />
                            <p className="text-sm text-slate-500 mt-1">Please be as detailed as possible for fast delivery</p>
                        </div>
                    )}
                </div>

                {/* Order Details Summary */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Order Details</h3>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Order Type:</span>
                            <span className="font-bold text-slate-900">
                                {orderType === 'delivery' && '🚚 Delivery'}
                                {orderType === 'pickup' && '🏪 Pickup'}
                                {orderType === 'dine_in' && '🍽️ Dine In'}
                            </span>
                        </div>

                        {orderType === 'delivery' && (
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-600">Address:</span>
                                <span className="font-bold text-slate-900 text-right max-w-xs">{deliveryAddress || 'Not provided yet'}</span>
                            </div>
                        )}

                        {orderType === 'dine_in' && (
                            <div className="space-y-2 pt-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Booking Time:</span>
                                    <span className="font-bold text-slate-900">{dineInTime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Number of Guests:</span>
                                    <span className="font-bold text-slate-900">{dineInPax} Pax</span>
                                </div>
                                {tableNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Table Preference:</span>
                                        <span className="font-bold text-slate-900">{tableNumber}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-slate-600">Items:</span>
                            <span className="font-bold text-slate-900">{cart.length} item(s)</span>
                        </div>
                    </div>
                </div>

                {/* Payment Note */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-amber-800 text-sm">
                        <span className="font-semibold">💳 Payment:</span> Payment details will be collected at the time of {orderType === 'delivery' ? 'delivery' : 'pickup'}. You can also pay in-store.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className={`btn-base w-full justify-center py-3 text-base ${
                        submitting
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                >
                    {submitting ? 'Processing...' : 'Place Order'}
                </button>

                <button
                    onClick={() => setCurrentStep('order')}
                    className="btn-base w-full justify-center py-3 text-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                >
                    Back to Menu
                </button>
            </div>

            {/* Cart Summary Sidebar */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <Cart />
                </div>
            </div>
        </div>
    );
}
