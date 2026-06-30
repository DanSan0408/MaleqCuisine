import React, { useContext } from 'react';
import { OrderContext } from '../context/OrderContext';
import OrderTypeModal from './OrderTypeModal';
import DeliveryFlow from './DeliveryFlow';
import PickupFlow from './PickupFlow';
import DineInFlow from './DineInFlow';
import Checkout from './Checkout';
import Layout from './Layout';

export default function OrderingSystem() {
    const { orderType, currentStep } = useContext(OrderContext);

    return (
        <Layout pageTitle="Order Now">
            {/* Show order type modal if no order type selected */}
            {!orderType && <OrderTypeModal />}

            {/* Show order flow if order type selected */}
            {orderType && currentStep !== 'checkout' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header with back button */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            {orderType === 'delivery' && '🚚 Order Delivery'}
                            {orderType === 'pickup' && '🏪 Order Pickup'}
                            {orderType === 'dine_in' && '🍽️ Dine In Ordering'}
                        </h1>
                        <button
                            onClick={() => window.location.href = '/customer/dashboard'}
                            className="btn-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                        >
                            ← Back
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="card mt-6">
                        {orderType === 'delivery' && <DeliveryFlow />}
                        {orderType === 'pickup' && <PickupFlow />}
                        {orderType === 'dine_in' && <DineInFlow />}
                    </div>
                </div>
            )}

            {/* Show checkout if checkout step */}
            {currentStep === 'checkout' && (
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Complete Your Order</h1>
                        <button
                            onClick={() => window.location.href = '/customer/dashboard'}
                            className="btn-base border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"
                        >
                            ← Back
                        </button>
                    </div>

                    <div className="mt-6">
                        <Checkout />
                    </div>
                </div>
            )}
        </Layout>
    );
}
