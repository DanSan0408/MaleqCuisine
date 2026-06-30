import React, { useState, useEffect, useContext } from 'react';
import { OrderContext } from '../context/OrderContext';
import MenuSelector from './MenuSelector';
import axios from 'axios';

export default function PickupFlow() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);
    
    const { selectedBranch, setSelectedBranch, setCurrentStep } = useContext(OrderContext);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/orders/branches');
            setBranches(response.data.branches || []);
            setError(null);
        } catch (err) {
            setError('Failed to load restaurant branches');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBranch = (branchId) => {
        setSelectedBranch(branchId);
    };

    const handleProceedToCheckout = () => {
        if (!selectedBranch) {
            alert('Please select a restaurant branch');
            return;
        }
        setCurrentStep('checkout');
    };

    const getMapEmbedUrl = (latitude, longitude) => {
        // Using OpenStreetMap embed
        return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Select Restaurant Branch</h2>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            {/* Branch Selection */}
            <div className="space-y-4">
                {branches.map(branch => (
                    <div
                        key={branch.id}
                        className={`rounded-3xl border-2 p-5 cursor-pointer transition ${
                            selectedBranch === branch.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-200 hover:border-amber-300 hover:-translate-y-0.5'
                        }`}
                        onClick={() => handleSelectBranch(branch.id)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">📍 {branch.name}</h3>
                                <p className="text-slate-600 text-sm font-medium mt-1">{branch.address}</p>
                                {branch.phone && (
                                    <p className="text-slate-500 text-sm mt-1">📞 {branch.phone}</p>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (branch.latitude && branch.longitude) {
                                        setShowMap(showMap === branch.id ? null : branch.id);
                                    }
                                }}
                                className="text-amber-700 hover:text-amber-800 font-bold text-sm underline"
                            >
                                {showMap === branch.id ? 'Hide Map' : 'Show Map'}
                            </button>
                        </div>

                        {/* Map View */}
                        {showMap === branch.id && branch.latitude && branch.longitude && (
                            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200">
                                <iframe
                                    width="100%"
                                    height="300"
                                    frameBorder="0"
                                    src={getMapEmbedUrl(branch.latitude, branch.longitude)}
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {branches.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-600 font-medium">
                    No restaurant branches available
                </div>
            )}

            {/* Selected Branch Display */}
            {selectedBranch && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Selected Branch</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                        {branches.find(b => b.id === selectedBranch)?.name}
                    </p>
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
