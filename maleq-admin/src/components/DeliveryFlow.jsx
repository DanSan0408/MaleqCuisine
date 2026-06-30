import React, { useState, useEffect, useContext } from 'react';
import { OrderContext } from '../context/OrderContext';
import MenuSelector from './MenuSelector';
import axios from 'axios';

export default function DeliveryFlow() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSessions, setShowSessions] = useState(true);
    
    const { deliverySessionId, setDeliverySessionId, setCurrentStep } = useContext(OrderContext);

    useEffect(() => {
        fetchDeliverySessions();
    }, []);

    const fetchDeliverySessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/orders/delivery-sessions');
            setSessions(response.data.sessions || []);
            setError(null);
        } catch (err) {
            setError('Failed to load delivery sessions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const canSelectSession = (session) => {
        return session.current_orders < session.max_orders;
    };

    const handleSelectSession = (sessionId) => {
        setDeliverySessionId(sessionId);
        setShowSessions(false);
    };

    const handleBackToSessions = () => {
        setShowSessions(true);
    };

    const handleProceedToCheckout = () => {
        if (!deliverySessionId) {
            alert('Please select a delivery session');
            return;
        }
        setCurrentStep('checkout');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"></div>
            </div>
        );
    }

    if (showSessions) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Choose Delivery Session</h2>
                
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className={`rounded-3xl border-2 p-5 transition ${
                                deliverySessionId === session.id
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-300'
                            } ${!canSelectSession(session) ? 'opacity-50' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">
                                        {session.session_type === 'morning' ? '🌅 Morning' : '🌙 Evening'} Session
                                    </h3>
                                    <p className="text-slate-600 text-sm font-medium">{session.start_time} - {session.end_time}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-slate-900">
                                        {session.max_orders - session.current_orders} spots left
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">of {session.max_orders} available</p>
                                </div>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2 mb-5">
                                <div
                                    className="bg-orange-500 h-2 rounded-full transition"
                                    style={{ width: `${(session.current_orders / session.max_orders) * 100}%` }}
                                ></div>
                            </div>

                            <button
                                onClick={() => handleSelectSession(session.id)}
                                disabled={!canSelectSession(session)}
                                className={`btn-base w-full justify-center ${
                                    canSelectSession(session)
                                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {canSelectSession(session) ? 'Select' : 'Full'}
                            </button>
                        </div>
                    ))}
                </div>

                {sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-600 font-medium">
                        No delivery sessions available
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Selected Session Display */}
            {deliverySessionId && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Selected Delivery Session</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {sessions.find(s => s.id === deliverySessionId)?.session_type === 'morning' ? '🌅 Morning' : '🌙 Evening'} (
                                {sessions.find(s => s.id === deliverySessionId)?.start_time} - {sessions.find(s => s.id === deliverySessionId)?.end_time})
                            </p>
                        </div>
                        <button
                            onClick={handleBackToSessions}
                            className="text-sm font-bold text-amber-700 hover:text-amber-800 underline"
                        >
                            Change
                        </button>
                    </div>
                </div>
            )}

            {/* Menu Selector */}
            <div>
                <MenuSelector />
            </div>

            {/* Proceed Button */}
            <button
                onClick={handleProceedToCheckout}
                className="btn-base w-full justify-center bg-orange-500 text-white transition hover:bg-orange-600 py-3 text-base"
            >
                Proceed to Checkout
            </button>

        </div>
    );
}
