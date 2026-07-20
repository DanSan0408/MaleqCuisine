# MaleqCuisine - System State

Last updated: 2026-06-09

## Workspace Overview

This workspace contains:
- `backend/`: Express + MySQL API for auth, admin, and **ordering** workflows.
- `maleq-admin/`: React + Vite admin frontend with **ordering system**.
- `mockup.html`: Standalone Tailwind + Alpine prototype for customer and kitchen/admin flows (not integrated with backend).
- `STATE.md`: This status document.
- `QUICK_START.md`: Quick start guide for the ordering system.
- `ORDERING_SYSTEM_SETUP.md`: Detailed backend setup and testing.
- `ORDERING_SYSTEM_COMPLETE.md`: Complete documentation and architecture.

## Backend State (`backend/`)

### Stack
- Node.js (CommonJS), Express `5.2.1`
- MySQL via `mysql2/promise`
- Auth via `jsonwebtoken` + `bcryptjs`
- CORS enabled globally

### Entrypoint and Boot Flow
- `server.js`
	- Loads env from `./keyes.env`
	- Registers middleware: `cors()`, `express.json()`
	- Mounts routes:
		- `/api/auth`
		- `/api/superadmin`
	- Listens on `process.env.PORT || 5000`


		### Session Defaults & Automation
		- `backend/utils/deliverySessions.js`
			- Defines daily delivery templates for morning `11:30-13:00` and evening `14:00-16:00`
			- Auto-ensures sessions exist for the current date before customer/admin session reads
			- Supports admin editing of the default daily session templates
			- **Automated Cleanup**: Includes a background job that automatically runs every 24 hours to delete delivery sessions older than a day. Safely unlinks older sessions from `orders` (sets `delivery_session_id = NULL`) to ensure historical order data is preserved.
### Database
- `config/db.js`
	- Creates MySQL pool using env vars: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
	- Exports pooled connection object

### Auth and RBAC
- `middleware/authMiddleware.js`
	- Expects `Authorization: Bearer <token>`
	- Verifies JWT using `JWT_SECRET`
	- Supports role-based checks via `verifyToken([roles])`
	- Sets `req.userId` and `req.userRole`

### API Surface
			- Returns available delivery sessions after auto-ensuring today's morning/evening sessions
#### Auth
- `POST /api/auth/login`
	- Body: `{ email, password }`
	- Behavior:
		- Looks up user by email
		- Compares password hash

		#### Admin
		- `GET /api/admin/sessions` (role: `admin`, `superadmin`)
			- Returns all delivery sessions, including today’s generated defaults
		- `GET /api/admin/sessions/templates` (role: `admin`, `superadmin`)
			- Returns the editable daily templates for morning/evening sessions
		- `PUT /api/admin/sessions/templates/:sessionType` (role: `admin`, `superadmin`)
			- Updates the default time window and capacity for `morning` or `evening`
		- `POST /api/admin/sessions/ensure-daily` (role: `admin`, `superadmin`)
			- Forces creation of today’s default sessions if they are missing
		- Returns `{ id, email, role, accessToken }`
- `POST /api/auth/register`
	- Body: `{ email, password }`
		- Creates a `customer` user
		- Hashes password before insert
		- Returns the new customer with `{ id, email, role, accessToken }`
			- Collect delivery address in checkout when order type is `delivery`

#### Superadmin
- `GET /api/superadmin/dashboard` (role: `superadmin`)
	- Returns admin list: `{ admins: [{ id, email, created_at }] }`
- `POST /api/superadmin/add-admin` (role: `superadmin`)
	- Body: `{ email, password }`
	- Creates new user with role `admin`
			- Includes a back-to-home button that redirects to `/customer/dashboard`
		- `SessionManagement.jsx`
			- Lets admin edit the daily morning/evening templates
			- Supports creating, editing, toggling, and resetting delivery sessions

#### Orders
- `POST /api/orders/create` (role: `customer`, any authenticated user)
	- Body: `{ orderType, customerName, customerPhone, customerEmail, items[], deliverySessionId?, deliveryAddress?, branchId?, tableNumber? }`
	- Note: `items` array expects objects like `{ menu_item_id, quantity, remarks }`.
	- Creates new order for delivery/pickup/dine-in
	- Supports three order types: `delivery`, `pickup`, `dine_in`
	- Automatically assigns a specialized sequential `order_number` (e.g., `D001`, `P001`, `A001`) that loops from 001 to 999.
- `GET /api/orders/user-orders` (authenticated)
	- Returns user's order history
- `POST /api/orders/track/by-phone` (public)
	- Returns every order linked to the submitted phone number
- `GET /api/orders/:orderId` (authenticated)
	- Returns specific order details with items
- `GET /api/orders/menu` (public)
	- Returns all available menu items
- `GET /api/orders/categories` (public)
	- Returns active menu sections in display order
- `GET /api/orders/branches` (public)
	- Returns all restaurant branches
- `GET /api/orders/delivery-sessions` (public)
	- Returns available delivery sessions

#### Payments
- `GET /api/payment/settings`, `PUT /api/payment/settings` (admin)
	- Fetch and update QR Pay image for customers.
- `GET /api/payment/orders/pending-verifications` (admin)
	- Returns orders waiting for receipt verification (`payment_status = 'pending_verification'`).
- `GET /api/payment/orders/logs` (admin)
	- Returns recent completed/failed payment logs.
- `POST /api/payment/orders/:orderId/receipt` (authenticated)
	- Allows customers to upload a payment receipt and updates status to `pending_verification`.
- `PUT /api/payment/orders/:orderId/verify-payment` (admin)
	- Verifies the uploaded receipt, marks order as `paid`, and updates general order status to `confirmed`.

#### Dashboard (New)
- `GET /api/dashboard/config` (public)
	- Returns full dashboard layout data (slideshow, featured menu items, home story, full company stories, and settings).
- `GET /api/dashboard/slideshow`, `POST ...`, `PUT .../:id`, `DELETE .../:id` (admin)
	- Manages promotional images for the slideshow.
- `GET /api/dashboard/featured`, `POST ...`, `PUT .../:id`, `DELETE .../:id` (admin)
	- Manages featured menu items.
- `GET /api/dashboard/story`, `PUT /api/dashboard/story` (admin)
	- Manages both the short home story (id=1) and the multiple full story sections (id>1), including layout style preferences (`background` or `side`).

- `GET /api/orders/track/:trackingToken`
	- Remains the live tracking link for a single order
- `POST /api/orders/track/lookup`
	- Still available for direct order recovery, but the UI now prefers phone-based lookup

		Recently added alignment:
		- Delivery address is now collected at checkout for delivery orders instead of in the delivery step.
		- Daily delivery sessions are guaranteed from templates, so customer ordering can always show morning and evening slots for the current day.

### Scripts
- `npm run dev` -> `nodemon server.js`
- `npm start` -> `node server.js`

## Frontend State (`maleq-admin/`)

### Stack
- React `19.2.5`
- React Router `7.14.2`
- Axios for API calls
- Vite `8.0.10`
- Tailwind CSS configured and loaded via `index.css`

### Design System
- The frontend fully implements the "Warm Editorial Luxury" design guidelines.
- Global styling tokens (colors, typography, shadows, animations) are defined in `index.css` and mapped via `tailwind.config.js`.
- **Key Components:**
	- `Header.jsx`: A sticky, glassmorphism header shared globally for consistent brand identity and auth management.
	- `Layout.jsx`: A standardized page wrapper that enforces the warm radial gradient background and staggered entrance animations.
- Overlays like `OrderTypeModal.jsx` utilize React Portals to break out of animation stacking contexts and render correctly above the `Header`.

### Routing and Pages
- `src/App.jsx` routes:
	- `/` -> redirect to `/customer/order` (Updated to display ordering popup immediately upon visit)
	- `/login` -> `Login`
	- `/register` -> customer registration
	- `/superadmin/dashboard` -> `SuperAdminDashboard`
	- `/superadmin/add-admin` -> `AddAdmin`
	- `/admin/dashboard` -> `AdminDashboard`
	- `/admin/invite` -> `InviteAdmin`
	- `/customer/dashboard` -> `CustomerDashboard`
	- `/customer/order` -> `OrderingSystem` (NEW)
	- `/customer/story` -> `CompanyStoryPage` (NEW)

### Current Behavior
- `CustomerDashboard.jsx`
	- Public landing page at `/` and `/customer/dashboard`
	- Does not require login to view
	- Shows login/register actions for guests
	- Replaces those actions with a user avatar menu after login or registration
	- Uses `DashboardSections.jsx` to display a pre-configured layout:
		- **Slideshow**: Auto-rotating promotional images.
		- **Order Method Selection**: Three interactive selection cards (Dine In, Delivery, Pickup) routing directly into the ordering flow.
		- **Our Story**: Supports dynamic immersive `background` and alternating `side` image premium layouts.
	- Features an edge-to-edge luxury design while keeping content beautifully centered, with conditional button displays optimized for mobile/desktop.
- `CompanyStoryPage.jsx` (NEW)
	- Standalone public page displaying multiple company story sections.
	- Wrapped with the global `Header` but uses a custom edge-to-edge layout for an immersive full-screen background image and alternating side-image experience.
- `OrderingSystem.jsx` (NEW)
	- Now renders as an immersive popup modal overlaid on a blurred `CustomerDashboard`, avoiding a hard page transition.
	- Authenticates user before showing ordering.
	- Shows `OrderTypeModal` to choose Delivery/Pickup/Dine In (now styled with playful glassmorphism).
	- Routes to appropriate flow (`DeliveryFlow`, `PickupFlow`, `DineInFlow`) using the new Card System and fully rounded pill buttons.
	- Includes a close ("X") button to gracefully dismiss the modal and reveal the full clean dashboard.
	- Manages checkout process.
- `MenuSelector.jsx` (NEW)
	- Features a custom Remarks Modal when adding items, allowing users to specify special requests (e.g., "no onions").
- `Cart.jsx` (NEW)
	- Order summary sidebar that separates identical items based on distinct remarks.
- `DeliveryFlow.jsx` (NEW)
	- Select morning (11:30-13:00) or evening (14:00-16:00) delivery session
	- Each session limited to 8 orders (automatic capacity tracking)
	- Enter delivery address
	- Select menu items
- `PickupFlow.jsx` (NEW)
	- Select restaurant branch
	- View map with branch location
	- Select menu items
- `DineInFlow.jsx` (NEW)
	- Select arrival time (Standard 1-hour intervals or Special Booking hours before 10 AM / after 4 PM)
	- Select number of guests (pax)
	- Enter table number
	- Select menu items
- `Checkout.jsx` (NEW)
	- Collect name (required), phone (required), email (optional)
	- Display order summary
	- Show subtotal and total
	- Payment deferred for future implementation
- `CustomerOrders.jsx` (NEW)
	- Requires authentication to access.
	- Automatically fetches orders linked directly to the user's account and merges them with any orders linked to the phone number saved during checkout (deduplicated by order ID).
	- Displays specialized order numbers (e.g., `P001`, `D001`).
- `OrderTracking.jsx`
	- Supports live tracking from a tokenized order link
	- Also supports phone-based recovery that returns all matching orders, then lets the customer open live tracking per order
	- Displays empty states clearly for phone numbers with no active orders.
	- Displays specialized order numbers.
- `Login.jsx`
	- Calls `POST http://localhost:5000/api/auth/login`
	- Stores `accessToken` and `role` in `localStorage`
	- Redirects by role (`superadmin`, `admin`, `customer`)
- `SuperAdminDashboard.jsx`
	- Calls `GET /api/superadmin/dashboard` with Bearer token
	- Displays admins table
	- Redirect target on missing/invalid token: `/login`
- `AddAdmin.jsx`
	- Calls `POST /api/superadmin/add-admin`
- `AdminDashboard.jsx`
	- Calls `GET /api/admin/dashboard` with the new gradient and `card-elevated` layouts.
	- Includes logout and link to invite page
	- Contains the `OrderManagement` tab for live order tracking, displaying specialized order numbers, and the `DashboardDesigner` tab for layout configuration.
	- Includes a `PaymentManagement` tab for handling QR pay settings and manual payment verifications.
- `PaymentManagement.jsx` (NEW)
	- Dedicated dashboard for administrators to upload active QR codes, review uploaded customer receipts, and verify pending orders. Includes a completed payment log.
- `DashboardDesigner.jsx` (NEW)
	- Admin interface for customizing the pre-configured customer dashboard layout.
	- Includes tabs for Slideshow, Home Page Story (with layout toggles), and Full Story Page sections (Featured Items and Payment tabs removed).
- `InviteAdmin.jsx`
	- Calls `POST /api/admin/invite`

### UI/Project Structure Notes
- `src/components/` now contains ordering system components:
	- `OrderingSystem.jsx` - Main orchestrator
	- `OrderTypeModal.jsx` - Initial popup (Delivery/Pickup/Dine In)
	- `DeliveryFlow.jsx` - Delivery-specific flow with session selection
	- `PickupFlow.jsx` - Pickup-specific flow with branch/map selection
	- `DineInFlow.jsx` - Dine-in specific flow with table number
	- `MenuSelector.jsx` - Shared menu component with categories
	- `Cart.jsx` - Order summary sidebar
	- `Checkout.jsx` - Unified checkout form
	- `Header.jsx` - Standardized glassmorphic app header
	- `Layout.jsx` - Standardized app shell with brand background
- Menu sections are now sourced from `menu_categories` and menu items are grouped by section order on both admin and customer views.
- `MenuManagement.jsx` now shows all available sections and lets admins create new sections before assigning items to them.
- `MenuSelector.jsx` now loads sections from the public categories endpoint and renders items under section headings.
- `src/context/` now contains:
	- `OrderContext.jsx` - State management for orders (cart, customer info, order type)
- `src/App.css` appears to be leftover starter/template CSS and is not imported by `App.jsx`.
- Tailwind is configured in `tailwind.config.js` and injected via `src/index.css`.
- App.jsx wrapped with `OrderProvider` for global ordering state

### Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Prototype State (`mockup.html`)

- Standalone prototype with:
	- Customer-facing menu/order/checkout/tracking flow
	- Admin kitchen/order board and menu management toggles
- Uses CDN Tailwind and AlpineJS.
- Logic is in-browser only (no persisted backend integration).

## Data and Contract Alignment

Current frontend/backend contracts are largely aligned for:
- Login response fields: `accessToken`, `role`
- Dashboard response shape: `admins[]` with `created_at`
- Admin creation/invite payloads: `{ email, password }`

Recently aligned:
- Item Remarks: The `order_items` schema now includes a `remarks` column. `createOrder` accepts it, and all item-fetching queries return it. The frontend `OrderContext` separates identical items based on different remarks.
- Order Representation: Backend now supplies `order_number` (e.g. `P001`) for display purposes instead of the database `id`. Frontend components have been updated to render `{order.order_number}` across all views.

Alignment status:
- Customer dashboard is the primary visual backdrop. `/` now routes to `/customer/order` to instantly display the ordering popup over the dashboard. Closing the popup reveals the underlying dashboard content (`/customer/dashboard`).
- Order recovery uses a hybrid approach: authenticated users automatically see their account and phone-linked orders, while public tracking strictly relies on phone-based lookups.

## Risks and Gaps (Current)

1. Secrets handling risk
- `backend/keyes.env` exists in workspace and currently includes live credentials/secrets.

2. Payment implementation (Resolved - Basic Phase)
- Billplz/QR-based payment module is implemented. Customers can upload receipts for manual verification. `payment_status` and `payment_method` exist in the `orders` table. Full automated gateway integration (Stripe, Billplz automatic webhook) can be added as a future enhancement.

3. Order status tracking (Resolved)
- Orders created now successfully flow through a status pipeline (pending → preparing → ready → completed).
- Kitchen/admin order management board is implemented and live.

4. Minimal validation and hardening
- Email/password payload validation is minimal.
- Login has no brute-force/rate-limiting protection.
- Order creation validation present but could be enhanced.
- Menu item create/update now supports both JSON and multipart form submissions, but legacy databases without `menu_items.is_available` still rely on schema-aware fallback logic.

5. Duplicate business logic
- `inviteAdmin` and `addAdmin` both create admins with similar implementation; opportunity to consolidate service logic.

6. Limited test/quality pipeline
- No backend tests.
- Frontend lint exists, but no test suite configured.
- Frontend production build passed recently; backend `npm run dev` still exits with code 1 and needs follow-up debugging.

7. Menu schema drift
- Some existing databases still lack `menu_items.is_available` even though the newer app path expects it.
- Admin menu updates now fall back safely when that column is missing, instead of failing on legacy schemas.

## Recommended Next Steps

1. Database & Ordering
- Set up order database tables using `backend/database/schema.sql`
- Populate menu items, branches, and delivery sessions
- See `ORDERING_SYSTEM_SETUP.md` for detailed instructions
2. Recovery UX
- Keep the phone number captured at checkout as the primary recovery key
- Consider pre-filling the customer orders page from the last used phone number after login

3. Advanced Gateway Integration
- Optionally integrate an automated payment gateway (e.g., Stripe or Billplz automatic redirects/webhooks) for fully automated payment processing instead of manual receipt verification.

4. Order Management (Partial)
- Status tracking and the admin board are complete. Next step: Add real-time order notifications to instantly update the UI.

4. Security and config
- Move secrets to local untracked env files, rotate exposed credentials
- Ensure `.gitignore` excludes env secrets
- Add request validation on all endpoints

5. Frontend auth architecture
- Add protected route wrapper(s)
- Central auth state with context provider

6. Backend robustness
- Add schema-based request validation
- Central error handling middleware
- Optional rate-limiting on auth endpoints

7. Testing
- Add baseline tests for auth and order controllers
- Frontend component tests
