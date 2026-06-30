import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { OrderContext } from '../context/OrderContext';

export default function OrderTypeModal() {
    const { setOrderType, setCurrentStep } = useContext(OrderContext);

    const handleSelectType = (type) => {
        setOrderType(type);
        setCurrentStep('order');
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="card-elevated max-w-md w-full mx-4 p-8 relative overflow-hidden bg-white rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.16)] animate-fade-in-up">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center text-slate-900 mb-8">
                    How would you like to order?
                </h2>

                <div className="space-y-4">
                    {/* Delivery Option */}
                    <button
                        onClick={() => handleSelectType('delivery')}
                        className="w-full flex items-center p-5 rounded-3xl border-2 border-slate-100 bg-white transition-all hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 text-left group"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors mr-4 shrink-0">
                            <span className="text-xl">🚚</span>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">Delivery</div>
                            <div className="text-sm font-medium text-slate-500">Fast delivery to your address</div>
                        </div>
                    </button>

                    {/* Pickup Option */}
                    <button
                        onClick={() => handleSelectType('pickup')}
                        className="w-full flex items-center p-5 rounded-3xl border-2 border-slate-100 bg-white transition-all hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 text-left group"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors mr-4 shrink-0">
                            <span className="text-xl">🏪</span>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">Pickup</div>
                            <div className="text-sm font-medium text-slate-500">Pick up from restaurant</div>
                        </div>
                    </button>

                    {/* Dine In Option */}
                    <button
                        onClick={() => handleSelectType('dine_in')}
                        className="w-full flex items-center p-5 rounded-3xl border-2 border-slate-100 bg-white transition-all hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 text-left group"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors mr-4 shrink-0">
                            <span className="text-xl">🍽️</span>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">Dine In</div>
                            <div className="text-sm font-medium text-slate-500">Eat at our restaurant</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    // Portals allow the modal to break out of the parent's layout and animation hierarchy
    return createPortal(modalContent, document.body);
}
