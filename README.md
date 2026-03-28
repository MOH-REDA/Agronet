# 🌾 AgroNet - Agricultural Equipment Rental Platform

A modern, full-stack peer-to-peer marketplace platform for renting and listing agricultural equipment. Connect farmers and equipment owners to share resources efficiently and sustainably.

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)
![Laravel](https://img.shields.io/badge/Laravel-12-red)
![React](https://img.shields.io/badge/React-19-blue)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### 🏘️ Equipment Management
- **List & Discover Equipment**: Post your agricultural equipment with detailed specifications
- **Multi-Image Support**: Upload multiple high-quality images of your equipment
- **Advanced Filtering**: Search by type, price range, location, and availability dates
- **Location-Based Search**: Discover equipment near you using geographic filtering
- **Real-time Availability**: Automatic conflict detection to prevent double-booking
- **Dynamic Pricing**: Support for tiered rental pricing (low, medium, high, very high)

### 📅 Reservation & Booking System
- **Date-Range Reservations**: Flexible booking with start and end dates
- **Availability Management**: Real-time availability checking across all reservations
- **Reservation Tracking**: Monitor active, cancelled, and completed bookings
- **Instant Notifications**: Get notified for each booking event

### 💳 Payment Processing
- **Multiple Payment Methods**: Cash and PayPal integration ready
- **Secure Transactions**: Transaction tracking with unique IDs
- **Payment Status Management**: Monitor pending, completed, and refunded payments
- **Multi-Currency Support**: Default to MAD (Moroccan Dirham)

### 👥 User Management
- **User Authentication**: Secure API authentication with Sanctum tokens
- **User Profiles**: Manage personal information, address, and contact details
- **Admin Dashboard**: Comprehensive tools for platform management
- **User Moderation**: Admin controls for user management and verification

### 🔔 Smart Notifications
- **Real-Time Alerts**: Stay updated with booking and payment notifications
- **Customizable Messages**: Detailed notification data for different events
- **Read/Unread Tracking**: Manage notification history
- **Email Integration**: EmailJS for email notifications

### 🗺️ Interactive Maps
- **Leaflet Maps Integration**: Visual equipment location discovery
- **Location Autocomplete**: Easy location search with Places.js
- **Map Filtering**: Find equipment by geographic proximity

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12 (PHP 8.2)
- **API**: RESTful API with Laravel Sanctum authentication
- **Database**: MySQL with Eloquent ORM
- **Testing**: Pest Framework
- **Task Queues**: Database-driven queue system

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: Material-UI (MUI), Bootstrap 5
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React-Toastify
- **Maps**: Leaflet + React-Leaflet
- **Location**: Places.js autocomplete

### DevOps & Tools
- **Package Managers**: Composer (PHP), npm (Node.js)
- **Version Control**: Git
- **Environment Configuration**: .env files

---

## 📁 Project Structure

```
agronet/
├── backend/                          # Laravel Backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/         # API Controllers
│   │   │   ├── Middleware/          # Authentication & CORS
│   │   │   └── Kernel.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Equipment.php
│   │   │   ├── EquipmentReservation.php
│   │   │   ├── Payment.php
│   │   │   ├── Notification.php
│   │   │   └── EquipmentReview.php
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/              # Database schema
│   │   ├── factories/               # Seeders
│   │   └── seeders/
│   ├── routes/
│   │   ├── api.php                 # API Routes
│   │   ├── web.php
│   │   └── console.php
│   ├── config/                      # Configuration files
│   ├── storage/
│   │   ├── app/public/equipment/   # Equipment images
│   │   └── logs/
│   ├── tests/
│   ├── artisan                      # Laravel CLI
│   ├── composer.json
│   └── .env.example
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── EquipmentSidebarFilter.jsx
│   │   │   ├── DashboardLayout/
│   │   │   ├── Navbar/
│   │   │   ├── Footer/
│   │   │   └── ProtectedRoute/
│   │   ├── pages/
│   │   │   ├── Equipment/           # Equipment browsing & details
│   │   │   ├── Admin/               # Admin dashboard
│   │   │   └── Auth/                # Authentication
│   │   ├── services/
│   │   │   └── api.js              # API integration
│   │   ├── assets/
│   │   │   ├── equipment/           # Images
│   │   │   └── images/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
└── README.md
```

---

## 📸 Screenshots

### Home & Equipment Browsing
*Add screenshots here showing the equipment listing page, filters, and equipment cards*

```
📁 Suggested locations for screenshots:
- /docs/screenshots/equipment-list.png - Equipment grid view
- /docs/screenshots/equipment-filter.png - Filtering interface
- /docs/screenshots/equipment-detail.png - Equipment detail page
```

### Reservation & Booking
*Add screenshots of the reservation modal and booking flow*

```
- /docs/screenshots/reservation-modal.png
- /docs/screenshots/booking-confirmation.png
```

### Admin Dashboard
*Add screenshots of the admin management interface*

```
- /docs/screenshots/admin-dashboard.png
- /docs/screenshots/user-management.png
- /docs/screenshots/equipment-management.png
```

### User Profile & Notifications
*Add screenshots of user features*

```
- /docs/screenshots/user-profile.png
- /docs/screenshots/notifications.png
```

---

## 🚀 Installation

### Prerequisites
- **PHP 8.2+** with extensions: curl, dom, hash, json, mbstring, openssl, xml
- **Node.js 16+** and npm 7+
- **MySQL 8.0+**
- **Composer**

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Create environment configuration**
   ```bash
   copy .env.example .env
   ```

4. **Generate application key**
   ```bash
   php artisan key:generate
   ```

5. **Configure database in `.env`**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=agronet
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Create database**
   ```bash
   # MySQL CLI
   mysql -u root -p
   CREATE DATABASE agronet;
   exit;
   ```

7. **Run migrations**
   ```bash
   php artisan migrate
   ```

8. **Create storage symlink** (enabling image serving)
   ```bash
   php artisan storage:link
   ```

9. **Install JavaScript dependencies for Vite**
   ```bash
   npm install
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment configuration**
   ```bash
   copy .env.example .env
   ```

4. **Update environment variables if needed**
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_APP_NAME=AgroNet
   ```

---

## ⚡ Quick Start

### Start Development Servers

**Terminal 1 - Backend Server**
```bash
cd backend
php artisan serve
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend Dev Server**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Verify Installation
- Frontend: Visit `http://localhost:5173`
- Backend API: Visit `http://localhost:8000/api` (will show 404, but server is running)

---

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```env
APP_NAME=AgroNet
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=agronet

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=log
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=AgroNet
```

### File Uploads
- Equipment images are stored in `storage/app/public/equipment/`
- Accessed via `http://localhost:8000/storage/equipment/[filename]`
- Storage symlink required: `php artisan storage:link`

---

## 📚 API Documentation

### Authentication
All protected routes require `Authorization: Bearer {token}` header.

**Get Token**
```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### Equipment Endpoints

**List All Equipment**
```bash
GET /api/equipment
Query Parameters:
  - type: Equipment type filter
  - city: Location filter
  - minPrice, maxPrice: Price range
  - startDate, endDate: Availability filter
```

**Get Equipment Details**
```bash
GET /api/equipment/{id}
```

**Create Equipment (Authenticated)**
```bash
POST /api/equipment
Content-Type: multipart/form-data

{
  "name": "Tractor",
  "description": "...",
  "type": "Tractor",
  "price": 150,
  "location": "...",
  "images": [file1, file2]
}
```

### Reservation Endpoints

**Create Reservation**
```bash
POST /api/reservations/{equipment_id}
Content-Type: application/json

{
  "start_date": "2025-04-01",
  "end_date": "2025-04-05"
}
```

**Get User Reservations**
```bash
GET /api/reservations
Returns: Array of authenticated user's reservations
```

### Payment Endpoints

**Create Payment**
```bash
POST /api/payments
Content-Type: application/json

{
  "reservation_id": 1,
  "amount": 750,
  "method": "paypal"
}
```

### Notification Endpoints

**Get User Notifications**
```bash
GET /api/notifications
Returns: Array of user's unread notifications
```

---

## 🗄️ Database Schema

### Core Tables

**users**
- id, name, email, password, phone, address, is_admin, created_at, updated_at

**equipment**
- id, user_id, name, description, type, status, price, location, images, gps_ready, horsepower, created_at, updated_at

**equipment_reservations**
- id, equipment_id, user_id, start_date, end_date, status, created_at, updated_at

**payments**
- id, reservation_id, amount, method, status, transaction_id, created_at, updated_at

**notifications**
- id, user_id, data, description, read_at, created_at, updated_at

**equipment_reviews** (Ready for implementation)
- id, equipment_id, user_id, rating, comment, created_at, updated_at

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- Follow PSR-12 for PHP code
- Use ESLint configuration for JavaScript/React
- Write tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact & Support

For questions, issues, or suggestions:
- **Report Issues**: GitHub Issues
- **Email**: [Add your contact email]
- **Documentation**: Check the `/docs` folder

---

## 🙏 Acknowledgments

- Laravel community for the excellent framework
- React community for powerful UI capabilities
- All contributors and users of AgroNet

---

## 📌 Roadmap

- [ ] Equipment reviews & ratings system
- [ ] Advanced payment gateway integration (PayPal, Stripe)
- [ ] Equipment rental analytics
- [ ] Mobile app (React Native)
- [ ] Real-time chat between users
- [ ] Equipment quality verification system
- [ ] Insurance integration
- [ ] Multi-language support

---

**Built with ❤️ for the agricultural community**
