import React, { createContext, useState, useCallback } from 'react';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
    const [orderType, setOrderType] = useState(null); // 'delivery', 'pickup', 'dine_in'
    const [cart, setCart] = useState([]);
    const [currentStep, setCurrentStep] = useState('landing'); // 'landing', 'type', 'order', 'checkout'
    
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

    const addToCart = useCallback((menuItem, remarks = '') => {
        setCart(prevCart => {
            const cartItemId = `${menuItem.id}-${remarks.trim()}`;
            const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
            if (existingItem) {
                return prevCart.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...menuItem, quantity: 1, remarks: remarks.trim(), cartItemId }];
            }
        });
    }, []);

    const removeFromCart = useCallback((cartItemId) => {
        setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    }, []);

    const updateCartQuantity = useCallback((cartItemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.cartItemId === cartItemId
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
        setCurrentStep('landing');
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
