import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MenuManagement() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        quantity: 999,
        image: null,
        available: true
    });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchMenuItems();
        fetchCategories();
    }, []);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/menu', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
            const response = await axios.get('http://localhost:5000/api/admin/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategories(response.data.categories || []);
        } catch (err) {
            console.error('Failed to load categories');
        }
    };

    const sortedItems = [...menuItems].sort((left, right) => {
        const leftIndex = categories.findIndex(category => category.name === left.category);
        const rightIndex = categories.findIndex(category => category.name === right.category);
        const safeLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const safeRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

        if (safeLeftIndex !== safeRightIndex) {
            return safeLeftIndex - safeRightIndex;
        }

        const leftSection = left.category || 'Uncategorized';
        const rightSection = right.category || 'Uncategorized';

        if (leftSection !== rightSection) {
            return leftSection.localeCompare(rightSection);
        }

        return (left.name || '').localeCompare(right.name || '');
    });

    const handleCreateCategory = async (e) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            setCategoryError('Section name is required');
            return;
        }

        try {
            await axios.post(
                'http://localhost:5000/api/admin/categories',
                { name: categoryName.trim() },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setCategoryName('');
            setCategoryError('');
            setShowCategoryForm(false);
            fetchCategories();
        } catch (err) {
            setCategoryError(err.response?.data?.message || 'Failed to create section');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const renderItemCard = (item) => (
        <div key={item.id} className="flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition animate-fade-in-up">
            {item.image_url ? (
                <img
                    src={`http://localhost:5000${item.image_url}`}
                    alt={item.name}
                    className="w-full h-48 object-cover shrink-0"
                />
            ) : (
                <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    🍽️ No Image
                </div>
            )}

            <div className="p-5 flex flex-col flex-1">
                {item.category && (
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.35em] mb-1">{item.category}</p>
                )}
                <h4 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h4>

                {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1 font-medium">{item.description}</p>
                )}

                <div className="flex flex-col mt-auto pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-black text-slate-900">{item.price} KD</span>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                                (item.available ?? item.is_available) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {(item.available ?? item.is_available) ? 'Available' : 'Unavailable'}
                            </span>
                            {item.quantity < 100 && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                    Stock: {item.quantity}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => handleEdit(item)}
                            className="btn-base flex-1 justify-center border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700 text-xs"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="btn-base flex-1 justify-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 text-xs"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('quantity', formData.quantity);
            formDataToSend.append('available', formData.available);
            if (formData.image instanceof File) {
                formDataToSend.append('image', formData.image);
            }

            if (editingId) {
                await axios.put(
                    `http://localhost:5000/api/admin/menu/${editingId}`,
                    formDataToSend,
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        } 
                    }
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/admin/menu',
                    formDataToSend,
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        } 
                    }
                );
            }
            
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                quantity: 999,
                image: null,
                available: true
            });
            setImagePreview(null);
            setEditingId(null);
            setShowForm(false);
            fetchMenuItems();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save menu item');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category || '',
            quantity: item.quantity || 999,
            image: null,
            available: item.available ?? item.is_available ?? true
        });
        if (item.image_url) {
            setImagePreview(`http://localhost:5000${item.image_url}`);
        }
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleDelete = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                await axios.delete(
                    `http://localhost:5000/api/admin/menu/${itemId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                fetchMenuItems();
            } catch (err) {
                setError('Failed to delete menu item');
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            quantity: 999,
            image: null,
            available: true
        });
        setImagePreview(null);
    };


    if (loading) {
        return <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
                    <p className="text-sm text-gray-500">Use sections like Beverages, Snacks, or Desserts to group menu items.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowCategoryForm((prev) => !prev)}
                        className="border border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-2 rounded-lg font-semibold transition"
                    >
                        {showCategoryForm ? '✕ Close Section Form' : '+ Add Section'}
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                        {showForm ? '✕ Cancel Item' : '+ Add Item'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {showCategoryForm && (
                <div className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Add New Section</h3>
                        <p className="text-sm text-gray-500">Create a section first, then assign menu items to it.</p>
                    </div>
                    {categoryError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {categoryError}
                        </div>
                    )}
                    <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="e.g., Beverages"
                            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                        />
                        <button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                        >
                            Save Section
                        </button>
                    </form>
                </div>
            )}

            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Available Sections</h3>
                        <p className="text-sm text-gray-500">These are the sections used to sort the menu.</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-500">{categories.length} section{categories.length === 1 ? '' : 's'}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {categories.length === 0 ? (
                        <span className="text-sm text-gray-500">No sections created yet.</span>
                    ) : (
                        categories.map(category => (
                            <span key={category.id} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                                {category.name}
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-gray-50 border rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">
                        {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            {imagePreview ? (
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="h-32 w-32 object-cover rounded-lg"
                                    />
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2">Change Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setFormData(prev => ({ ...prev, image: null }));
                                            }}
                                            className="mt-2 text-red-600 hover:text-red-800 font-semibold"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <label className="block text-gray-700 font-semibold mb-2">📷 Upload Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Grilled Chicken Burger"
                                    required
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Price (KD) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="2.500"
                                    required
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">Select a section</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                {categories.length === 0 && (
                                    <p className="mt-2 text-xs text-gray-500">No sections yet. Create one first, such as Beverages.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="999"
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Item details and ingredients"
                                rows="3"
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="available"
                                checked={formData.available}
                                onChange={handleInputChange}
                                className="w-4 h-4 rounded"
                            />
                            <label className="text-gray-700 font-semibold">Available for Order</label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                            >
                                {editingId ? 'Update Item' : 'Add Item'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Menu Items Grid */}
            <div className="space-y-8">
                {menuItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No menu items found
                    </div>
                ) : (
                    categories.length > 0 ? (
                        <>
                            {categories.map(category => {
                                const items = sortedItems.filter(item => item.category === category.name);

                                return (
                                    <section key={category.id} className="space-y-4">
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
                                                <p className="text-sm text-gray-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
                                            </div>
                                        </div>

                                        {items.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                                                No items in this section yet.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {items.map(renderItemCard)}
                                            </div>
                                        )}
                                    </section>
                                );
                            })}

                            {sortedItems.some(item => !item.category) && (
                                <section className="space-y-4">
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">Uncategorized</h3>
                                            <p className="text-sm text-gray-500">{sortedItems.filter(item => !item.category).length} item{sortedItems.filter(item => !item.category).length === 1 ? '' : 's'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sortedItems.filter(item => !item.category).map(renderItemCard)}
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        Object.entries(
                            sortedItems.reduce((groups, item) => {
                                const sectionName = item.category?.trim() || 'Uncategorized';
                                if (!groups[sectionName]) {
                                    groups[sectionName] = [];
                                }
                                groups[sectionName].push(item);
                                return groups;
                            }, {})
                        ).map(([sectionName, items]) => (
                            <section key={sectionName} className="space-y-4">
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{sectionName}</h3>
                                        <p className="text-sm text-gray-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map(item => (
                                        <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition bg-white">
                                            {item.image_url ? (
                                                <img
                                                    src={`http://localhost:5000${item.image_url}`}
                                                    alt={item.name}
                                                    className="w-full h-40 object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                                                    🍽️ No Image
                                                </div>
                                            )}

                                            <div className="p-4 space-y-2">
                                                <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>

                                                {item.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                                )}

                                                <div className="flex justify-between items-center py-2 border-t border-b">
                                                    <span className="text-2xl font-bold text-orange-600">{item.price} KD</span>
                                                    {item.quantity < 100 && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                            Stock: {item.quantity}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                        item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.available ? '✓ Available' : '✗ Unavailable'}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2 pt-3">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition font-semibold"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
