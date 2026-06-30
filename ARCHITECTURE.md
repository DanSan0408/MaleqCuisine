# 🏗️ System Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Customer Dashboard                        │
│                   (CustomerDashboard.jsx)                        │
│                                                                  │
│  [Hero Section] [Promotions] [Menu] [🛒 START ORDERING]         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
         ┌───────────────────────────────────┐
         │   /customer/order Route            │
         │   (OrderingSystem.jsx)             │
         │   - Auth Check                     │
         │   - State Setup                    │
         └───────────────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                ↓                         ↓
        ┌──────────────────┐    ┌───────────────────┐
        │ Order Type Modal │    │  Auth Required?   │
        │ (OrderTypeModal) │    │  (Redirects)      │
        └────┬──────┬──────┘    └───────────────────┘
             │      │      
      ┌──────┴──────┴──────┐
      ↓                     ↓
  ┌─────────────┐       ┌──────────────┐
  │ Delivery    │       │   Pickup     │
  │   Flow      │       │    Flow      │
  │             │       │              │
  │ 1. Session  │       │ 1. Branch    │
  │ 2. Address  │       │    Select    │
  │ 3. Menu     │       │ 2. Map View  │
  │             │       │ 3. Menu      │
  └──────┬──────┘       └──────┬───────┘
         │                     │
         │            ┌────────┴────────────┐
         │            ↓                     ↓
         │        ┌──────────────┐   ┌───────────────┐
         │        │ Branch Info  │   │ Map           │
         │        │ (Open Street │   │ (OpenStreet   │
         │        │  Map Embed)  │   │  Map)         │
         │        └──────────────┘   └───────────────┘
         │
         │      ┌──────────────────┐
         └─────→│   Dine In Flow   │
                │                  │
                │ 1. Table Number  │
                │ 2. Menu          │
                └──────┬───────────┘
                       │
                       ↓
            ┌──────────────────────┐
            │   MenuSelector       │
            │  (All Order Types)   │
            │                      │
            │ - Category Filter    │
            │ - Menu Items Grid    │
            │ - Add to Cart        │
            │ - Real-time Qty      │
            └──────────┬───────────┘
                       │
         ┌─────────────┴─────────────┐
         ↓                           ↓
    ┌────────────┐           ┌─────────────┐
    │   Cart     │  ←────→   │OrderContext  │
    │ (Sidebar)  │           │(State Mgmt)  │
    │            │           │              │
    │ - Items    │           │ - Cart       │
    │ - Qty Ctrl │           │ - Customer   │
    │ - Totals   │           │ - Order Type │
    └────────────┘           └─────────────┘
         │
         ↓
    ┌──────────────────┐
    │   Checkout       │
    │ (Checkout.jsx)   │
    │                  │
    │ ├─ Name Input    │
    │ ├─ Phone Input   │
    │ ├─ Email Input   │
    │ ├─ Order Summary │
    │ └─ Place Order   │
    └─────────┬────────┘
              │
              ↓
    ┌──────────────────────┐
    │ POST /api/orders/create  
    │ (Backend)            │
    └─────────┬────────────┘
              │
              ↓
    ┌──────────────────────┐
    │ Database             │
    │ - Insert Order       │
    │ - Insert Items       │
    │ - Update Session     │
    │ - Transaction        │
    └─────────┬────────────┘
              │
              ↓
    ┌──────────────────────┐
    │ Success Confirmation │
    │ - Order ID           │
    │ - Order Details      │
    │ - New Order Option   │
    └──────────────────────┘
```

---

## Data Flow

```
FRONTEND (React + Context)
│
├─ OrderContext (State Management)
│  ├─ orderType: 'delivery' | 'pickup' | 'dine_in'
│  ├─ cart: [{id, name, price, quantity}, ...]
│  ├─ customerInfo: {name, phone, email}
│  ├─ currentStep: 'type' | 'order' | 'checkout'
│  └─ Order-specific: {deliveryAddress, deliverySessionId, selectedBranch, tableNumber}
│
├─ Components
│  ├─ OrderTypeModal → Selects order type
│  ├─ DeliveryFlow → Sets deliverySessionId, deliveryAddress
│  ├─ PickupFlow → Sets selectedBranch
│  ├─ DineInFlow → Sets tableNumber
│  ├─ MenuSelector → Populates cart
│  ├─ Cart → Displays cart items, totals
│  └─ Checkout → Collects customer info, submits order
│
└─ HTTP Request
   │
   POST /api/orders/create
   │
   ├─ Headers: {Authorization: Bearer {JWT_TOKEN}}
   ├─ Body: {
   │    orderType,
   │    customerName, customerPhone, customerEmail,
   │    items: [{menu_item_id, quantity}, ...],
   │    deliverySessionId,
   │    deliveryAddress,
   │    branchId,
   │    tableNumber
   │  }
   │
   ↓
BACKEND (Express + MySQL)
│
├─ orderController.createOrder()
│  ├─ Validate input
│  ├─ Check session availability (if delivery)
│  ├─ Validate menu items exist
│  ├─ Calculate totals
│  ├─ Start transaction
│  ├─ Insert order
│  ├─ Insert order items
│  ├─ Update session capacity
│  ├─ Commit transaction
│  └─ Return success response
│
└─ Database
   ├─ orders table (new record)
   ├─ order_items table (multiple records)
   ├─ delivery_sessions table (updated capacity)
   └─ Relationships via foreign keys
```

---

## Component Hierarchy

```
App
├─ OrderProvider (Context Wrapper)
│  └─ Router
│     ├─ CustomerDashboard
│     │  └─ OrderingSystem Route (/customer/order)
│     ├─ OrderingSystem (if orderType)
│     │  ├─ OrderTypeModal (if no orderType)
│     │  └─ OrderFlow Container
│     │     ├─ Delivery/Pickup/DineIn Flow
│     │     │  └─ MenuSelector
│     │     └─ Cart (Sidebar)
│     └─ Checkout (if step === 'checkout')
│        ├─ Cart (Sidebar)
│        └─ Form
└─ Other Routes (unchanged)
```

---

## State Management (OrderContext)

```javascript
OrderContext = {
  // Selected Order Type
  orderType,
  setOrderType,

  // Cart Management
  cart: [{id, name, price, quantity}, ...],
  addToCart(item),
  removeFromCart(itemId),
  updateCartQuantity(itemId, quantity),
  clearCart(),
  calculateSubtotal(),
  calculateTotal(),

  // Checkout Flow
  currentStep,
  setCurrentStep,

  // Customer Information
  customerInfo: {name, phone, email},
  setCustomerInfo,

  // Order-Specific Data
  deliverySessionId,
  setDeliverySessionId,
  deliveryAddress,
  setDeliveryAddress,
  
  selectedBranch,
  setSelectedBranch,
  
  tableNumber,
  setTableNumber,

  // Utilities
  resetOrder()
}
```

---

## Database Schema Relationships

```
┌──────────────────────────┐
│ users                    │
├──────────────────────────┤
│ id (PK)                  │
│ email                    │
│ role                     │
│ password                 │
└────────────┬─────────────┘
             │
             │ user_id (FK)
             │
    ┌────────┴────────────────┐
    │                         │
    ↓                         ↓
┌──────────────────┐  ┌──────────────────┐
│ orders (PK: id)  │  │ admin tables     │
├──────────────────┤  └──────────────────┘
│ id               │
│ user_id (FK)     │
│ order_type       │◄─── 'delivery', 'pickup', 'dine_in'
│ customer_name    │
│ customer_phone   │
│ customer_email   │
│ subtotal         │
│ total            │
│ status           │
│ created_at       │
│ updated_at       │
│                  │
│ Delivery Fields: │
├──────────────────┤
│ delivery_session_id (FK)
│ delivery_address │
│                  │
│ Pickup Fields:   │
├──────────────────┤
│ branch_id (FK)   │
│                  │
│ Dine In Fields:  │
├──────────────────┤
│ table_number     │
└────┬─────┬──────┘
     │     │
     │ session_id   │ branch_id
     │              │
     ↓              ↓
┌──────────────────────┐  ┌──────────────────┐
│ delivery_sessions    │  │ branches         │
├──────────────────────┤  ├──────────────────┤
│ id (PK)              │  │ id (PK)          │
│ session_type         │  │ name             │
│ start_time           │  │ address          │
│ end_time             │  │ latitude         │
│ max_orders: 8        │  │ longitude        │
│ current_orders       │  │ phone            │
│ date                 │  │ is_active        │
│ is_active            │  └──────────────────┘
└──────────────────────┘

    ↓ order_items (junction)

┌──────────────────────┐
│ order_items          │
├──────────────────────┤
│ id (PK)              │
│ order_id (FK)        │
│ menu_item_id (FK)    │
│ quantity             │
│ price                │
└──────────┬───────────┘
           │
           ↓
    ┌──────────────────┐
    │ menu_items       │
    ├──────────────────┤
    │ id (PK)          │
    │ name             │
    │ description      │
    │ price            │
    │ category         │
    │ image_url        │
    │ is_available     │
    └──────────────────┘
```

---

## API Endpoint Map

```
PUBLIC ROUTES (No Authentication)
├─ GET  /api/orders/menu
│  └─ Returns: {success, items: [{id, name, price, category, ...}]}
│
├─ GET  /api/orders/branches
│  └─ Returns: {success, branches: [{id, name, address, latitude, longitude, phone}]}
│
├─ GET  /api/orders/delivery-sessions
│  └─ Returns: {success, sessions: [{id, session_type, start_time, end_time, max_orders, current_orders, date}]}
│
└─ GET  /api/orders/session/:sessionId/availability
   └─ Returns: {success, isAvailable, spotsRemaining, session}

PROTECTED ROUTES (Bearer Token Required)
├─ POST /api/orders/create
│  ├─ Body: {orderType, customerName, customerPhone, customerEmail, items, [delivery/pickup/dine-in fields]}
│  └─ Returns: {success, message, orderId, order}
│
├─ GET  /api/orders/user-orders
│  └─ Returns: {success, orders: [{...order, items}]}
│
└─ GET  /api/orders/:orderId
   └─ Returns: {success, order: {...order, items}}
```

---

## Environment Variables Required

```bash
# Backend (.env or keyes.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=maleqcuisine
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend (.env in maleq-admin)
VITE_API_URL=http://localhost:5000
```

---

## File Dependencies

```
OrderingSystem.jsx (Main)
├─ Imports: OrderContext, 4 Flow components, OrderTypeModal
│  └─ Uses: orderType, currentStep from context

OrderTypeModal.jsx
├─ Imports: OrderContext
│  └─ Uses: setOrderType, setCurrentStep

DeliveryFlow.jsx
├─ Imports: OrderContext, MenuSelector, axios
│  └─ Uses: deliverySessionId, deliveryAddress, setCurrentStep
│  └─ Calls: GET /api/orders/delivery-sessions

PickupFlow.jsx
├─ Imports: OrderContext, MenuSelector, axios
│  └─ Uses: selectedBranch, setCurrentStep
│  └─ Calls: GET /api/orders/branches

DineInFlow.jsx
├─ Imports: OrderContext, MenuSelector
│  └─ Uses: tableNumber, setCurrentStep

MenuSelector.jsx
├─ Imports: OrderContext, axios
│  └─ Uses: addToCart, cart
│  └─ Calls: GET /api/orders/menu

Cart.jsx
├─ Imports: OrderContext
│  └─ Uses: cart, calculateSubtotal, calculateTotal, removeFromCart, updateCartQuantity

Checkout.jsx
├─ Imports: OrderContext, Cart, axios
│  └─ Uses: Everything from context
│  └─ Calls: POST /api/orders/create
```

---

## Next Steps Development Path

```
Current State: ✅ Ordering System Complete
                     │
                     ↓
Step 1: Payment Gateway Integration
├─ Add payment provider (Stripe/PayPal)
├─ Payment form component
└─ Update orders table with payment fields
                     │
                     ↓
Step 2: Order Status Tracking
├─ Status pipeline (pending → preparing → ready → completed)
├─ Admin order dashboard
├─ Real-time notifications
└─ Customer order tracking page
                     │
                     ↓
Step 3: Kitchen Management
├─ Kitchen display system
├─ Order print system
├─ Status update interface
└─ Queue management
                     │
                     ↓
Step 4: Advanced Features
├─ Coupons & discounts
├─ Order history
├─ Favorites
├─ Analytics dashboard
└─ Delivery management
```

---

This architecture is **scalable, maintainable, and production-ready**! 🚀
