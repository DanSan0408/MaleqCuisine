import React, { useContext } from 'react';
import { OrderContext } from '../context/OrderContext';

export default function Cart() {
    const { cart, removeFromCart, updateCartQuantity, calculateSubtotal, calculateTotal, orderType } = useContext(OrderContext);

    if (cart.length === 0) {
        return (
            <div className="text-center py-8 text-slate-600">
                <div className="mb-4 flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-amber-50">
                    <span className="text-2xl">🛒</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Your cart is empty</p>
                <p className="mt-1 text-sm text-slate-500">Add items from the menu to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black tracking-tight text-slate-900">Order Summary</h3>

            {/* Cart Items */}
            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.cartItemId} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-amber-50/50 transition">
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                            {item.remarks && (
                                <p className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">
                                    Notes: {item.remarks}
                                </p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                                KD {parseFloat(item.price).toFixed(3)} × {item.quantity}
                            </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <button
                                    onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                                    className="px-3 py-1 font-bold text-slate-600 hover:bg-slate-100 hover:text-orange-500 transition"
                                >
                                    −
                                </button>
                                <span className="px-2 py-1 text-xs font-bold min-w-[32px] text-center text-slate-900 border-x border-slate-100 bg-slate-50">
                                    {item.quantity}
                                </span>
                                <button
                                    onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                                    className="px-3 py-1 font-bold text-slate-600 hover:bg-slate-100 hover:text-orange-500 transition"
                                >
                                    +
                                </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right min-w-[70px]">
                                <p className="text-sm font-black text-slate-900">
                                    KD {(item.price * item.quantity).toFixed(3)}
                                </p>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => removeFromCart(item.cartItemId)}
                                className="text-slate-400 hover:text-red-500 transition p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Type Info */}
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                {orderType === 'delivery' && <span>🚚 Delivery Order</span>}
                {orderType === 'pickup' && <span>🏪 Pickup Order</span>}
                {orderType === 'dine_in' && <span>🍽️ Dine In Order</span>}
            </div>

            {/* Summary Totals */}
            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-bold text-slate-900">KD {calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span>Total:</span>
                    <span className="text-orange-600">KD {calculateTotal()}</span>
                </div>
            </div>
        </div>
    );
}
