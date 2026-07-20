import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { OrderContext } from '../context/OrderContext';
import DeliveryFlow from './DeliveryFlow';
import PickupFlow from './PickupFlow';
import DineInFlow from './DineInFlow';
import Checkout from './Checkout';
import CustomerDashboard from '../pages/CustomerDashboard';
import logoMain from '../assets/logoMain.jpg';

export default function OrderingSystem() {
    const { orderType, currentStep, setOrderType, setCurrentStep, resetOrder } = useContext(OrderContext);
    const navigate = useNavigate();

    // We removed the unconditional resetOrder() on mount because it was wiping out 
    // selections (like clicking 'Delivery' on the dashboard). The initial state in 
    // OrderContext or InitialRedirect handles showing the landing page on fresh loads.

    const handleClose = () => {
        resetOrder();
        navigate('/customer/dashboard');
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-md overflow-y-auto p-4 sm:p-6 lg:p-10">
            <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(245,118,0,0.2)] my-4 sm:my-10 p-6 sm:p-10 animate-fade-in-up border-4 border-white">
                
                {/* X Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 h-12 w-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#FFE77A]/80 hover:text-[#DE4F02] transition-all hover:scale-110 z-50 shadow-sm"
                    aria-label="Close ordering"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                {/* Step 0: Landing */}
                {!orderType && currentStep === 'landing' && (
                    <div className="max-w-md w-full mx-auto py-8 sm:py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <img src={logoMain} alt="Maleq Cuisine Logo" className="w-48 h-48 object-contain mb-8 drop-shadow-lg rounded-[2rem]" />
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 mb-6 drop-shadow-sm">
                            Welcome to Maleq Cuisine
                        </h2>
                        <p className="text-slate-500 font-bold mb-10 text-lg">
                            Experience warm editorial luxury with our carefully curated menu.
                        </p>
                        <button
                            onClick={() => setCurrentStep('type')}
                            className="w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-[#F57600] to-[#DE4F02] text-white text-xl font-black shadow-[0_8px_32px_rgba(245,118,0,0.3)] hover:shadow-[0_16px_48px_rgba(245,118,0,0.4)] hover:-translate-y-1 transition-all duration-300 transform"
                        >
                            Start Ordering Now
                        </button>
                    </div>
                )}

                {/* Step 1: Choose Order Type */}
                {!orderType && currentStep === 'type' && (
                    <div className="max-w-md w-full mx-auto py-8 sm:py-12">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center text-slate-800 mb-10 drop-shadow-sm">
                            How would you like to order?
                        </h2>
                        <div className="space-y-4">
                            {/* Delivery */}
                            <button
                                onClick={() => { setOrderType('delivery'); setCurrentStep('order'); }}
                                className="w-full flex items-center p-6 rounded-[2rem] border-2 border-slate-100 bg-white transition-all hover:border-[#F57600] hover:shadow-[0_12px_32px_rgba(245,118,0,0.15)] hover:-translate-y-1 text-left group"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE77A]/40 text-[#F57600] group-hover:bg-gradient-to-br group-hover:from-[#FF9633] group-hover:to-[#F57600] group-hover:text-white transition-all duration-300 mr-6 shrink-0 shadow-sm group-hover:scale-110">
                                    <span className="text-3xl drop-shadow-sm">🚚</span>
                                </div>
                                <div>
                                    <div className="text-xl font-black text-slate-800 group-hover:text-[#DE4F02] transition-colors">Delivery</div>
                                    <div className="text-sm font-bold text-slate-500 group-hover:text-slate-600 transition-colors">Fast delivery to your address</div>
                                </div>
                            </button>
                            {/* Pickup */}
                            <button
                                onClick={() => { setOrderType('pickup'); setCurrentStep('order'); }}
                                className="w-full flex items-center p-6 rounded-[2rem] border-2 border-slate-100 bg-white transition-all hover:border-[#FF9633] hover:shadow-[0_12px_32px_rgba(245,118,0,0.15)] hover:-translate-y-1 text-left group"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE77A]/40 text-[#F57600] group-hover:bg-gradient-to-br group-hover:from-[#FF9633] group-hover:to-[#F57600] group-hover:text-white transition-all duration-300 mr-6 shrink-0 shadow-sm group-hover:scale-110">
                                    <span className="text-3xl drop-shadow-sm">🏪</span>
                                </div>
                                <div>
                                    <div className="text-xl font-black text-slate-800 group-hover:text-[#F57600] transition-colors">Pickup</div>
                                    <div className="text-sm font-bold text-slate-500 group-hover:text-slate-600 transition-colors">Pick up from restaurant</div>
                                </div>
                            </button>
                            {/* Dine In */}
                            <button
                                onClick={() => { setOrderType('dine_in'); setCurrentStep('order'); }}
                                className="w-full flex items-center p-6 rounded-[2rem] border-2 border-slate-100 bg-white transition-all hover:border-[#DE4F02] hover:shadow-[0_12px_32px_rgba(245,118,0,0.15)] hover:-translate-y-1 text-left group"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE77A]/40 text-[#DE4F02] group-hover:bg-gradient-to-br group-hover:from-[#FF9633] group-hover:to-[#F57600] group-hover:text-white transition-all duration-300 mr-6 shrink-0 shadow-sm group-hover:scale-110">
                                    <span className="text-3xl drop-shadow-sm">🍽️</span>
                                </div>
                                <div>
                                    <div className="text-xl font-black text-slate-800 group-hover:text-[#DE4F02] transition-colors">Dine In</div>
                                    <div className="text-sm font-bold text-slate-500 group-hover:text-slate-600 transition-colors">Eat at our restaurant</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Order Flow */}
                {orderType && currentStep !== 'checkout' && (
                    <div className="max-w-4xl mx-auto pt-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b-2 border-slate-100 gap-4">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 drop-shadow-sm flex items-center gap-3">
                                {orderType === 'delivery' && <><span className="text-4xl">🚚</span> Order Delivery</>}
                                {orderType === 'pickup' && <><span className="text-4xl">🏪</span> Order Pickup</>}
                                {orderType === 'dine_in' && <><span className="text-4xl">🍽️</span> Dine In Ordering</>}
                            </h1>
                            <button
                                onClick={() => { setOrderType(null); setCurrentStep('type'); }}
                                className="btn-base rounded-full border-2 border-[#FFE77A] bg-white text-[#DE4F02] hover:border-[#F57600] hover:bg-[#FFE77A]/20 transition-all hover:scale-105 shrink-0"
                            >
                                ← Change Type
                            </button>
                        </div>
                        <div className="mt-4">
                            {orderType === 'delivery' && <DeliveryFlow />}
                            {orderType === 'pickup' && <PickupFlow />}
                            {orderType === 'dine_in' && <DineInFlow />}
                        </div>
                    </div>
                )}

                {/* Step 3: Checkout */}
                {currentStep === 'checkout' && (
                    <div className="max-w-5xl mx-auto pt-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b-2 border-slate-100 gap-4">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 drop-shadow-sm flex items-center gap-3">
                                <span className="text-4xl">✨</span> Complete Your Order
                            </h1>
                            <button
                                onClick={() => setCurrentStep('order')}
                                className="btn-base rounded-full border-2 border-[#FFE77A] bg-white text-[#DE4F02] hover:border-[#F57600] hover:bg-[#FFE77A]/20 transition-all hover:scale-105 shrink-0"
                            >
                                ← Back to Menu
                            </button>
                        </div>
                        <div className="mt-4">
                            <Checkout />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* The underlying blurred dashboard */}
            <div className="w-full h-screen overflow-hidden pointer-events-none blur-sm opacity-60 scale-[1.02] transition-all">
                <CustomerDashboard />
            </div>
            
            {/* The ordering modal in a portal */}
            {createPortal(modalContent, document.body)}
        </div>
    );
}
