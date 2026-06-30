import React, { useContext, useState } from 'react';
import { OrderContext } from '../context/OrderContext';
import MenuSelector from './MenuSelector';

const TIME_SLOTS = [
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM'
];

const GUEST_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, '10+'];

export default function DineInFlow() {
    const {
        tableNumber,
        setTableNumber,
        dineInTime,
        setDineInTime,
        dineInPax,
        setDineInPax,
        setCurrentStep,
        cart
    } = useContext(OrderContext);

    // Initial step logic: if booking details are already filled, go to menu pre-order step
    const [step, setStep] = useState(dineInTime && dineInPax ? 'menu' : 'booking');
    const [error, setError] = useState('');

    const handleContinueToMenu = () => {
        if (!dineInTime) {
            setError('Please select an arrival time slot.');
            return;
        }
        if (!dineInPax) {
            setError('Please select the number of guests (pax).');
            return;
        }
        setError('');
        setStep('menu');
    };

    const handleProceedToCheckout = () => {
        if (cart.length === 0) {
            alert('Your pre-order cart is empty. Please select at least one item from the menu.');
            return;
        }
        setCurrentStep('checkout');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {step === 'booking' ? (
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Dine In Reservation</p>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-1">Book Your Table</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Choose your arrival time and pax count before pre-ordering your menu.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Arrival Time Selection */}
                    <div className="space-y-3">
                        <label className="label">Select Arrival Time (1 Hour Intervals) *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {TIME_SLOTS.map((time) => {
                                const isSelected = dineInTime === time;
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => {
                                            setDineInTime(time);
                                            setError('');
                                        }}
                                        className={`px-4 py-3 rounded-2xl text-sm font-bold border transition ${
                                            isSelected
                                                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-orange-500 hover:text-orange-600'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Guests count Selection */}
                    <div className="space-y-3">
                        <label className="label">Number of Guests (Pax) *</label>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {GUEST_COUNTS.map((count) => {
                                const isSelected = dineInPax === count;
                                return (
                                    <button
                                        key={count}
                                        type="button"
                                        onClick={() => {
                                            setDineInPax(count);
                                            setError('');
                                        }}
                                        className={`py-3 rounded-2xl text-sm font-bold border transition text-center ${
                                            isSelected
                                                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-orange-500 hover:text-orange-600'
                                        }`}
                                    >
                                        {count}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Optional table preference */}
                    <div className="space-y-2">
                        <label className="label">Preferred Table or Special Request (Optional)</label>
                        <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="e.g., Table near window, Patio, Table 5, High chair needed"
                            className="input"
                        />
                        <p className="text-xs text-slate-500">
                            Let the restaurant know if you have a specific table preference or request.
                        </p>
                    </div>

                    {/* Action Button */}
                    <button
                        type="button"
                        onClick={handleContinueToMenu}
                        className="btn-base w-full justify-center bg-slate-950 text-white hover:bg-orange-600 py-3.5 text-base"
                    >
                        Confirm Booking & Choose Menu
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Booking Summary Banner */}
                    <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-800">Your Table Booking</p>
                            <h3 className="text-lg font-black text-slate-900">
                                🍽️ {dineInPax} {dineInPax === 1 ? 'Guest' : 'Guests'} at {dineInTime}
                            </h3>
                            {tableNumber && (
                                <p className="text-sm text-slate-600 font-medium">
                                    Preference: <span className="font-semibold text-slate-900">{tableNumber}</span>
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep('booking')}
                            className="btn-base border border-amber-300 bg-white text-amber-800 font-bold hover:bg-amber-100 hover:border-amber-400 self-start sm:self-auto"
                        >
                            Change Details
                        </button>
                    </div>

                    {/* Menu Selector */}
                    <div>
                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-600">Pre-order Menu</p>
                                <h3 className="text-xl font-black text-slate-900 mt-1">Select Menu Items</h3>
                            </div>
                            {cart.length > 0 && (
                                <span className="rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-bold">
                                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
                                </span>
                            )}
                        </div>
                        <MenuSelector />
                    </div>

                    {/* Proceed Button */}
                    <button
                        type="button"
                        onClick={handleProceedToCheckout}
                        className={`btn-base w-full justify-center py-3.5 text-base ${
                            cart.length === 0
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-transparent'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            )}
        </div>
    );
}
