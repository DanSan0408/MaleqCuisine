import React, { useContext, useState, useEffect } from 'react';
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

    const [paymentMethod, setPaymentMethod] = useState('qr_code');
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [receiptImage, setReceiptImage] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/payment/settings');
                if (res.data.settings && res.data.settings.qr_code_url) {
                    setQrCodeUrl(res.data.settings.qr_code_url);
                }
            } catch (err) {
                console.error('Failed to fetch payment settings:', err);
            }
        };
        fetchSettings();
    }, []);

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
        if (paymentMethod === 'qr_code' && !receiptImage) {
            setError('Please upload your payment receipt');
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
                items: cart.map(item => ({ menu_item_id: item.id, quantity: item.quantity, remarks: item.remarks || '' })),
                deliverySessionId: orderType === 'delivery' ? deliverySessionId : null,
                deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
                branchId: orderType === 'pickup' ? selectedBranch : null,
                tableNumber: orderType === 'dine_in' ? tableNumber : null,
                dineInTime: orderType === 'dine_in' ? dineInTime : null,
                dineInPax: orderType === 'dine_in' ? dineInPax : null,
                paymentMethod
            };

            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(
                'http://localhost:5000/api/orders/create',
                orderData,
                { headers }
            );

            if (response.data.success) {
                const orderId = response.data.orderId;
                
                // Upload receipt if qr_code payment
                if (paymentMethod === 'qr_code' && receiptImage) {
                    const formData = new FormData();
                    formData.append('receipt', receiptImage);
                    try {
                        const receiptHeaders = { 'Content-Type': 'multipart/form-data' };
                        if (token) receiptHeaders['Authorization'] = `Bearer ${token}`;
                        await axios.post(`http://localhost:5000/api/payment/orders/${orderId}/receipt`, formData, {
                            headers: receiptHeaders
                        });
                    } catch (receiptErr) {
                        console.error('Failed to upload receipt', receiptErr);
                    }
                }

                if (paymentMethod === 'gateway') {
                    alert('Redirecting to Billplz payment gateway (Placeholder)...');
                    // In a real implementation, you would redirect the user to a gateway URL provided by the backend.
                }

                localStorage.setItem('lastOrderId', String(orderId));
                localStorage.setItem('lastOrderPhone', customerInfo.phone.trim());

                resetOrder();

                if (response.data.trackingToken) {
                    localStorage.setItem('lastOrderTrackingToken', response.data.trackingToken);
                    navigate(`/track-order/${response.data.trackingToken}`, { replace: true });
                } else {
                    navigate('/customer/dashboard', { replace: true });
                    alert('Order placed successfully.');
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

                {/* Payment Method */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${paymentMethod === 'gateway' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
                            <input type="radio" name="paymentMethod" value="gateway" checked={paymentMethod === 'gateway'} onChange={() => setPaymentMethod('gateway')} className="hidden" />
                            <span className="block text-2xl mb-2">💳</span>
                            <span className="block font-bold text-slate-900">Online Payment (Billplz)</span>
                        </label>
                        <label className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${paymentMethod === 'qr_code' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
                            <input type="radio" name="paymentMethod" value="qr_code" checked={paymentMethod === 'qr_code'} onChange={() => setPaymentMethod('qr_code')} className="hidden" />
                            <span className="block text-2xl mb-2">📱</span>
                            <span className="block font-bold text-slate-900">QR Pay</span>
                        </label>
                    </div>

                    {paymentMethod === 'qr_code' && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4 mt-4">
                            <p className="text-sm text-amber-800 font-medium text-center">Please scan the QR code to make payment, then upload your receipt below to complete the order.</p>
                            {qrCodeUrl ? (
                                <img src={`http://localhost:5000${qrCodeUrl}`} alt="Payment QR Code" className="w-48 h-auto mx-auto border border-slate-200 rounded-lg shadow-sm" />
                            ) : (
                                <div className="w-48 h-48 bg-amber-100 mx-auto rounded-lg flex items-center justify-center text-sm text-amber-700 text-center p-4">QR Code not set by admin</div>
                            )}
                            <div>
                                <label className="label text-amber-900">Upload Payment Receipt *</label>
                                <input type="file" accept="image/*" onChange={(e) => setReceiptImage(e.target.files[0])} className="input bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500" />
                            </div>
                        </div>
                    )}
                    {paymentMethod === 'gateway' && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-slate-600 text-sm font-medium">You will be redirected to the secure Billplz payment gateway after placing the order.</p>
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
