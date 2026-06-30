import React, { createContext, useState, useCallback } from 'react';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
    const [orderType, setOrderType] = useState(null); // 'delivery', 'pickup', 'dine_in'
    const [cart, setCart] = useState([]);
    const [currentStep, setCurrentStep] = useState('type'); // 'type', 'order', 'checkout'
    
    // Delivery
    const [deliverySessionId, setDeliverySessionId] = useState(null);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    
    // Pickup
    const [selectedBranch, setSelectedBranch] = useState(null);
    
    // Dine In
    const [tableNumber, setTableNumber] = useState('');
    const [dineInTime, setDineInTime] = useState('');
    const [dineInPax, setDineInPax] = useState(2);
    
    // Checkout
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const addToCart = useCallback((menuItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === menuItem.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === menuItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...menuItem, quantity: 1 }];
            }
        });
    }, []);

    const removeFromCart = useCallback((menuItemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== menuItemId));
    }, []);

    const updateCartQuantity = useCallback((menuItemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(menuItemId);
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === menuItemId
                        ? { ...item, quantity }
                        : item
                )
            );
        }
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const calculateSubtotal = useCallback(() => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    }, [cart]);

    const calculateTotal = useCallback(() => {
        // No tax/fees for now as per requirements
        return calculateSubtotal();
    }, [calculateSubtotal]);

    const resetOrder = useCallback(() => {
        setOrderType(null);
        setCart([]);
        setCurrentStep('type');
        setDeliverySessionId(null);
        setDeliveryAddress('');
        setSelectedBranch(null);
        setTableNumber('');
        setDineInTime('');
        setDineInPax(2);
        setCustomerInfo({ name: '', phone: '', email: '' });
    }, []);

    const value = {
        // State
        orderType,
        cart,
        currentStep,
        deliverySessionId,
        deliveryAddress,
        selectedBranch,
        tableNumber,
        dineInTime,
        dineInPax,
        customerInfo,
        
        // Order type setters
        setOrderType,
        setCurrentStep,
        
        // Delivery setters
        setDeliverySessionId,
        setDeliveryAddress,
        
        // Pickup setters
        setSelectedBranch,
        
        // Dine In setters
        setTableNumber,
        setDineInTime,
        setDineInPax,
        
        // Customer info setter
        setCustomerInfo,
        
        // Cart methods
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        calculateSubtotal,
        calculateTotal,
        
        // Utilities
        resetOrder
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};
