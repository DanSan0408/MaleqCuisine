# 🍽️ Maleq Cuisine - Full Stack Restaurant Ordering & Admin System

![Maleq Cuisine](https://via.placeholder.com/1200x400.png?text=Maleq+Cuisine+Dashboard)

> A modern, full-stack restaurant management and ordering system built with **React**, **Node.js**, **Express**, and **MySQL**. This platform features a dynamic customer ordering interface and a comprehensive administrative dashboard for real-time menu management, order tracking, and custom promotional widgets.

## ✨ Features

### For Customers
- **Seamless Ordering:** Order for Delivery, Pickup, or Dine-In with an intuitive, mobile-responsive interface.
- **Dynamic Menu:** Real-time browsing of menu items with high-quality images, descriptions, and dynamic stock statuses.
- **Real-Time Updates:** Instantly view changes in menu availability or promotions without refreshing the page.

### For Administrators
- **Customizable Dashboard Designer:** A drag-and-drop or widget-based designer to feature promotions, top items, and banners directly on the customer front-page.
- **Menu & Inventory Management:** Full CRUD operations for menu items, categories, and stock tracking.
- **Order Management:** Monitor and update order statuses (Pending ➡️ Confirmed ➡️ Preparing ➡️ Ready ➡️ Completed).
- **Session & Branch Management:** Handle daily delivery capacity limits and manage multiple restaurant branches.
- **Image Management:** Seamless image upload handling for menu items and promotional banners.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, React Grid Layout
- **Backend:** Node.js, Express, RESTful APIs, JWT Authentication, Multer (for file uploads)
- **Database:** MySQL with a custom schema, optimized queries, and transaction support
- **Architecture:** Client-Server model with Bearer token authentication and strict CORS policies.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MySQL](https://www.mysql.com/) server running locally
- Git

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/MaleqCuisine.git
cd MaleqCuisine
```

#### 2. Database Setup
- Create a MySQL database (e.g., `maleq_cuisine`).
- Import the schema by running the SQL script located at `backend/database/schema.sql`:
  ```bash
  mysql -u root -p maleq_cuisine < backend/database/schema.sql
  ```

#### 3. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=maleq_cuisine
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend server:
```bash
npm run dev
```
*(The backend API will run at `http://localhost:5000`)*

#### 4. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd maleq-admin
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*(The frontend will run at `http://localhost:5173`)*

## 📁 Project Structure

```
MaleqCuisine/
├── backend/                  # Node.js & Express server
│   ├── controllers/          # Request handlers
│   ├── database/             # SQL schemas & DB connection config
│   ├── middleware/           # Auth and Multer upload middlewares
│   ├── public/uploads/       # Local image storage
│   ├── routes/               # API endpoints
│   └── server.js             # Main server entry point
├── maleq-admin/              # React frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── context/          # State management (OrderContext, etc.)
│   │   ├── pages/            # View components (AdminDashboard, etc.)
│   │   └── ...
└── DOCS_INDEX.md             # Detailed internal documentation & architectural guides
```

## 📸 Screenshots

*(Suggested: Add screenshots of your application here)*

<p align="center">
  <img src="https://via.placeholder.com/400x250.png?text=Customer+Ordering+Interface" width="45%" />
  <img src="https://via.placeholder.com/400x250.png?text=Admin+Dashboard" width="45%" />
</p>

## 👨‍💻 About Me

I'm a passionate **Full Stack Developer** actively looking for internship opportunities. This project demonstrates my ability to:
- Build complete, end-to-end web applications.
- Design relational databases and write optimized SQL queries.
- Handle complex state management and responsive UI design.
- Implement secure authentication and API integration.
- Manage file uploads and static file serving.

- 💼 **LinkedIn:** [Your LinkedIn Profile](https://www.linkedin.com/in/danial-ihsan-mohd-nadhir-66635b3a8/)
- 🐙 **GitHub:** [Your GitHub Profile](https://github.com/DanSan0408e)
- ✉️ **Email:** san.dan0408@gmail.com


---

*If you find this project interesting or helpful, please consider leaving a ⭐!*
