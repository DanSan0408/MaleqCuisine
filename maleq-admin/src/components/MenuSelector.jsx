import React, { useState, useEffect, useContext } from 'react';
import { OrderContext } from '../context/OrderContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function MenuSelector() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    
    // Remarks Modal State
    const [remarksModalItem, setRemarksModalItem] = useState(null);
    const [remarksText, setRemarksText] = useState('');
    
    const { addToCart, cart } = useContext(OrderContext);

    useEffect(() => {
        fetchMenuItems();
        fetchCategories();
    }, []);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/api/orders/menu`);
            setMenuItems(response.data.items || []);
            setError(null);
        } catch (err) {
            setError('Failed to load menu items');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/orders/categories`);
            setCategories(response.data.categories || []);
        } catch (err) {
            console.error('Failed to load menu sections', err);
        }
    };

    const getItemQuantity = (itemId) => {
        return cart.filter(i => i.id === itemId).reduce((sum, i) => sum + i.quantity, 0);
    };

    const handleOpenRemarks = (item) => {
        setRemarksModalItem(item);
        setRemarksText('');
    };

    const handleAddWithRemarks = (skip = false) => {
        if (remarksModalItem) {
            addToCart(remarksModalItem, skip ? '' : remarksText);
            setRemarksModalItem(null);
            setRemarksText('');
        }
    };

    const categoryFilters = ['all', ...categories.map(category => category.name), ...new Set(menuItems.map(item => item.category).filter(Boolean))].filter((value, index, array) => array.indexOf(value) === index);
    const filteredItems = filter === 'all' ? menuItems : menuItems.filter(item => item.category === filter);
    const sortedGroups = filteredItems.reduce((groups, item) => {
        const sectionName = item.category?.trim() || 'Uncategorized';
        if (!groups[sectionName]) {
            groups[sectionName] = [];
        }
        groups[sectionName].push(item);
        return groups;
    }, {});

    const orderedSections = categories.length > 0
        ? categories.map(category => ({
            name: category.name,
            items: (sortedGroups[category.name] || []).sort((left, right) => (left.name || '').localeCompare(right.name || ''))
        })).filter(section => filter !== 'all' ? section.name === filter : true)
        : Object.entries(sortedGroups)
            .map(([name, items]) => ({
                name,
                items: items.sort((left, right) => (left.name || '').localeCompare(right.name || ''))
            }))
            .filter(section => filter !== 'all' ? section.name === filter : true);

    const uncategorizedItems = filteredItems
        .filter(item => !item.category)
        .sort((left, right) => (left.name || '').localeCompare(right.name || ''));

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 text-sm font-semibold mb-4">{error}</p>
                <button
                    onClick={fetchMenuItems}
                    className="btn-base bg-orange-500 text-white hover:bg-orange-600"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Category Filter */}
            {categoryFilters.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categoryFilters.map(category => (
                        <button
                            key={category}
                            onClick={() => setFilter(category)}
                            className={`px-5 py-2 text-sm rounded-full whitespace-nowrap font-bold transition border ${
                                filter === category
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700'
                            }`}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    ))}
                </div>
            )}

            {/* Menu Items Grid */}
            <div className="space-y-10">
                {orderedSections.map(({ name: sectionName, items }) => (
                    <section key={sectionName} className="space-y-4">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Menu Section</p>
                                <h3 className="text-2xl font-black text-slate-900">{sectionName}</h3>
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {items.map(item => (
                                <div key={item.id} className="flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition">
                                    {item.image_url && (
                                        <img
                                            src={item.image_url?.startsWith('http') ? item.image_url : `${API_BASE}${item.image_url}`}
                                            alt={item.name}
                                            className="w-full h-56 object-cover"
                                        />
                                    )}

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-slate-600 text-sm font-medium line-clamp-2">{item.description}</p>
                                        )}

                                        <div className="flex justify-between items-center mt-auto pt-4">
                                            <div className="text-slate-900 font-black text-xl">
                                                KD {parseFloat(item.price).toFixed(3)}
                                            </div>

                                            <button
                                                onClick={() => handleOpenRemarks(item)}
                                                className="btn-base bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {getItemQuantity(item.id) > 0 && (
                                                    <span className="bg-white text-orange-500 rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-black">
                                                        {getItemQuantity(item.id)}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {uncategorizedItems.length > 0 && filter !== 'Uncategorized' && (
                    <section className="space-y-4">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Menu Section</p>
                                <h3 className="text-2xl font-black text-slate-900">Uncategorized</h3>
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{uncategorizedItems.length} item{uncategorizedItems.length === 1 ? '' : 's'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {uncategorizedItems.map(item => (
                                <div key={item.id} className="flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition">
                                    {item.image_url && (
                                        <img
                                            src={item.image_url?.startsWith('http') ? item.image_url : `${API_BASE}${item.image_url}`}
                                            alt={item.name}
                                            className="w-full h-56 object-cover"
                                        />
                                    )}

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-slate-600 text-sm font-medium line-clamp-2">{item.description}</p>
                                        )}

                                        <div className="flex justify-between items-center mt-auto pt-4">
                                            <div className="text-slate-900 font-black text-xl">
                                                KD {parseFloat(item.price).toFixed(3)}
                                            </div>

                                            <button
                                                onClick={() => handleOpenRemarks(item)}
                                                className="btn-base bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {getItemQuantity(item.id) > 0 && (
                                                    <span className="bg-white text-orange-500 rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-black">
                                                        {getItemQuantity(item.id)}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                        <span className="text-xl">🍽️</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No items available</p>
                    <p className="mt-1 text-sm text-slate-500">Try selecting a different category.</p>
                </div>
            )}

            {/* Remarks Modal */}
            {remarksModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-black text-slate-900">Any remarks for {remarksModalItem.name}?</h3>
                        <p className="mt-1 text-sm text-slate-500">e.g., no onions, extra spicy</p>
                        
                        <textarea
                            value={remarksText}
                            onChange={(e) => setRemarksText(e.target.value)}
                            className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            rows="3"
                            placeholder="Type your remarks here..."
                        ></textarea>
                        
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => handleAddWithRemarks(true)}
                                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                Skip
                            </button>
                            <button
                                onClick={() => handleAddWithRemarks(false)}
                                className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 shadow-sm"
                            >
                                Add to Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
