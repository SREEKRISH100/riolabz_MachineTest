# E-Commerce REST API & React Frontend

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7%2B-forestgreen.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-cyan.svg)](https://tailwindcss.com/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0-orange.svg)](http://localhost:5000/api-docs)

> **Machine Test Submission — Mid-Level Node.js Developer Position**  
> Complete implementation of a production-grade E-commerce REST API and modern React frontend featuring multi-level category hierarchies, atomic stock handling, role-based JWT authentication, and interactive Swagger documentation.

---

## 🌟 Key Modules & Implementations

### 1. User Management & Authentication
- **Secure Email & Password Authentication**: Passwords hashed using `bcryptjs` with salt rounds = 10 and hidden from query projections by default (`select: false`).
- **JWT-Based Authorization**: Tokens signed with configurable secret and expiration; attached via `Authorization: Bearer <token>` or HTTP-only cookies.
- **Role-Based Access Control (RBAC)**: Two distinct roles:
  - `admin`: Full administrative control over categories, products, all orders, and user activations.
  - `customer`: Product browsing, guest/authenticated cart, order placement, order tracking, and profile management.
- **Admin User Management**: Admin can list all users with pagination and search, view profiles, and **activate or deactivate accounts** (`isActive: true/false`). Deactivated users are immediately blocked from logging in or executing authenticated API requests.

### 2. Multi-Level Category Management (Infinite Nesting Depth)
- **Arbitrary Depth Hierarchy**: Supports categories nested to infinite levels without hardcoded depth limits.
  ```text
  Electronics
  ├── Mobiles
  │   ├── Android Phones
  │   │   ├── Samsung
  │   │   └── OnePlus
  │   └── iPhones
  └── Computers
      ├── Laptops
      └── Desktops
  ```
- **Materialized Path / Ancestor Array Pattern**: Each category document stores an indexed `ancestors` array `[ObjectId]`. This delivers:
  - **O(1)** ancestor retrieval.
  - **Single-query descendant retrieval**: `{ ancestors: categoryId }` instantly finds all children, grandchildren, and subcategories at any depth with a single index scan.
- **Circular Dependency Guard**: The API strictly prevents invalid or circular parent-child relationships:
  1. A category cannot be set as its own parent (`categoryId == parentId`).
  2. A category cannot select one of its own descendants as its parent (e.g. setting *Electronics* under *Samsung* is rejected with a `400 Bad Request: Circular dependency detected`).
- **Hierarchy Tree API**:
  - `GET /api/categories/tree` returns the full nested tree structure with recursive `children: []`.
  - `GET /api/categories?tree=true` also builds the complete recursive JSON tree.

### 3. Product Management & Descendant Category Filtering
- **Admin CRUD**: Create, update, delete, and list products with name, SKU (unique, uppercase), slug, description, price, sale price, stock, category reference, status (`active` / `inactive`), and image gallery.
- **Deep Category Descendant Filtering (Key Requirement)**:
  - When filtering by any parent category (e.g., `?category=electronics`), the system automatically traverses the tree and returns products belonging to that category **AND all its child/subcategories** (Mobiles, Android Phones, Samsung, OnePlus, iPhones, Computers, Laptops, Desktops)!
- **Customer Product Listing Supports**:
  - **Text Search**: Full-text / regex search over product name, SKU, and description.
  - **Price Range Filtering**: Filters effective product price between `minPrice` and `maxPrice`.
  - **Sorting**: Options for `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`.
  - **Pagination**: Structured pagination with `total`, `page`, `limit`, `totalPages`, `hasNextPage`, and `hasPrevPage`.

### 4. Order Management & Atomic Stock Handling
- **Backend Price Calculation**: Frontend prices and totals are **never trusted**. All unit prices, items subtotals, taxes (GST 5%), shipping fees, and final totals are strictly determined by querying the database.
- **Atomic Stock Reduction & Concurrency Protection**:
  - Stock is decremented atomically using MongoDB's `{ stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }`.
  - If any product in a multi-item cart has insufficient stock, the transaction/decrement is rolled back and a `400 Bad Request` specifying the exact depleted product is returned.
- **Stock Restoration on Cancellation**: If an order is transitioned to `Cancelled`, the reserved stock is automatically returned to the product inventory.
- **Status State Machine**:
  - `Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered` (or `Cancelled`).
  - Strict transition validation and append-only `statusHistory` audit trail with timestamp, updatedBy, and notes.

### 5. Guest & Customer Cart
- Supports anonymous visitors with a `guestToken` session header (`x-guest-token`).
- Cart items and quantities are persisted reliably in MongoDB (not client storage) with live price calculation and stock checks.
- **Seamless Cart Merging**: When a guest logs in or registers, their existing guest cart items are automatically merged into their customer account cart!

### 6. Cloudinary Image Management
- Integrated Cloudinary SDK and Multer for direct image uploads (`POST /api/upload/image`).
- **Automatic Asset Cleanup**: Whenever a product or category image is replaced or the product is deleted, the old image asset is automatically deleted from Cloudinary to eliminate orphaned cloud files.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017 (`mongodb://localhost:27017/testround`) or Docker

### 1. Clone & Setup Environment

```bash
git clone <repository-url>
cd Testound

# Configure Backend Environment Variables
cp backend/.env.example backend/.env
```

The default `.env` is pre-configured with:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/testround
JWT_SECRET=super_secret_jwt_key_testround_2026_midlevel_dev
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 2. Seed Database (Required on First Run)
Seeds the database with:
- Pre-built **Admin** and **Customer** test accounts
- The full multi-level category tree (*Electronics → Mobiles → Android Phones → Samsung / OnePlus, iPhones, Computers → Laptops / Desktops*)
- Rich product inventory with prices, sale prices, stock, and images

```bash
npm run seed
```

### 3. Run the Development Servers

In terminal 1 (Backend API):
```bash
npm run dev:backend
# API starts at http://localhost:5000
# Swagger documentation available at http://localhost:5000/api-docs
```

In terminal 2 (React Frontend):
```bash
npm run dev:frontend
# Vite frontend starts at http://localhost:5173
```

---

## 🔑 Default Credentials for Technical Evaluator

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ecommerce.com` | `Admin@1234` | Full access to `/admin` dashboard, Category Manager, Product CRUD, Order Status workflow, User Activation toggle |
| **Customer** | `customer@ecommerce.com` | `Customer@1234` | Storefront browsing, Category Tree filtering, Guest/User Cart, Checkout, Order Tracking |
| **Deactivated User** | `inactive@ecommerce.com` | `Customer@1234` | Test account showing access denial when deactivated by admin |

> *Tip: Enter these credentials in the Sign In modal to test Administrator or Customer capabilities. You can also customize them via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` before running `npm run seed`.*

---

## 📖 API Documentation (Swagger & Postman)

### 1. Markdown Documentation
- Detailed endpoint reference, schemas, request/response payloads, and error codes:
👉 **[API_DOCUMENTATION.md](file:///c:/Users/krish/OneDrive/Documents/GitHub/Testound/API_DOCUMENTATION.md)**

### 2. Interactive Swagger UI (OpenAPI 3.0)
Open your browser to:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

Raw OpenAPI specification:
👉 **[http://localhost:5000/api-docs/swagger.json](http://localhost:5000/api-docs/swagger.json)**

### 3. Postman Collection
A complete Postman collection is included in the project root:
- File: `postman_collection.json`
- Includes pre-configured environment variables (`baseUrl`, `adminToken`, `customerToken`) and auto-token assignment scripts on login.

---

## 🧪 Automated Test Suite

Run the automated test suite with:

```bash
npm test
```

The test runner validates 13 critical areas:
1. **Category Tree Builder**: Verifies nested structure generation from flat MongoDB collections.
2. **Circular Dependency Detection (Direct)**: Validates prevention of self-parenting cycles.
3. **Circular Dependency Detection (Indirect)**: Validates prevention of setting an ancestor category as a child of its descendant.
4. **Password Security**: Validates `bcrypt` salt hashing and authentication verification.
5. **Effective Price Calculation**: Validates `salePrice` vs regular price logic.
6. **Backend Order Math & Tax**: Validates backend subtotal, GST (5%), and shipping computation.
7. **Search Regex Sanitization**: Validates safe escaping of special characters to prevent ReDoS.
8. **Pagination Metadata**: Validates totalPages, skips, and boundary handling.
9. **Price Range Filtering**: Validates effective price bounds for regular and discounted products.
10. **Category Disambiguation**: Validates full breadcrumb paths (`Cloths → Men → T-Shirts`).
11. **Sibling Uniqueness**: Enforces uniqueness per parent while allowing same name across different branches.
12. **Guest Cart Merging**: Validates item merging, quantity increment, and deduplication.
13. **Order Status Confirmation**: Validates immediate `Confirmed` status and `Paid` payment state upon payment.

---

## 🐳 Docker Deployment

The application includes a production-ready `docker-compose.yml` orchestrating MongoDB, Backend API, and Nginx-served React frontend:

```bash
# Build and run the entire stack with a single command
docker-compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Swagger Docs**: `http://localhost:5000/api-docs`
- **MongoDB**: `localhost:27017`

---

## 📁 Project Directory Structure

```text
Testound/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection, Swagger OpenAPI specs
│   │   ├── controllers/        # Auth, User, Category, Product, Order, Cart
│   │   ├── middlewares/        # JWT auth, RBAC, error handler, Joi validation
│   │   ├── models/             # Mongoose schemas (User, Category, Product, Order, Cart)
│   │   ├── routes/             # Express route endpoints
│   │   ├── seed/               # Database seeder (Admin, Categories, Products)
│   │   ├── utils/              # ApiError, ApiResponse, asyncHandler, treeHelper
│   │   ├── validations/        # Joi request validation schemas
│   │   └── server.js           # Express app bootstrap & security headers
│   ├── tests/                  # Automated verification test suite
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, AuthModal
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ShopPage.jsx           # Catalog with recursive category tree sidebar
│   │   │   ├── ProductDetailPage.jsx  # Breadcrumb hierarchy, stock check
│   │   │   ├── CartPage.jsx           # Guest & customer cart
│   │   │   ├── CheckoutPage.jsx       # Order placement & address form
│   │   │   ├── OrdersPage.jsx         # Customer order history
│   │   │   ├── OrderDetailPage.jsx    # Tracking timeline & status history
│   │   │   ├── ProfilePage.jsx        # Profile & password management
│   │   │   └── admin/                 # Admin Dashboard, Categories Tree, Products, Orders, Users
│   │   ├── services/           # Axios interceptors (JWT & Guest Token)
│   │   ├── App.jsx             # React Router routing configuration
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── postman_collection.json     # Postman collection with test scripts
├── package.json
└── README.md
```

---

## 🎯 Machine Test Requirements Compliance Checklist

- [x] **User Management**:
  - [x] User registration and login (Email & Password)
  - [x] JWT-based authentication with expiration
  - [x] Roles: Admin and Customer
  - [x] User profile view and update
  - [x] Admin can view all users and activate/deactivate accounts
- [x] **Multi-Level Category Management**:
  - [x] Admin create, update, list, delete categories
  - [x] Multiple nested levels without fixed depth (*Electronics → Mobiles → Android Phones → Samsung / OnePlus*)
  - [x] Category tree API (`/api/categories/tree` and `?tree=true`)
  - [x] Prevention of invalid and circular parent-child relationships
- [x] **Product Management**:
  - [x] Admin CRUD (create, update, delete, list)
  - [x] Fields: name, SKU, description, price, sale price, stock, category, status
  - [x] Search (text/regex over name, SKU, description)
  - [x] Category filtering returning products in parent category AND all its subcategories
  - [x] Price filtering (min/max range)
  - [x] Sorting & pagination
- [x] **Order Management**:
  - [x] Authenticated customer order placement
  - [x] Product availability and stock validation
  - [x] Backend price and total calculation
  - [x] Atomic stock reduction and rollback protection
  - [x] Stock restoration upon cancellation
  - [x] Customers view only own orders; Admin views all orders and updates status
  - [x] Status workflow (*Pending → Confirmed → Processing → Shipped → Delivered / Cancelled*)
- [x] **Evaluation Bonuses Included**:
  - [x] Unit/Integration automated tests (`npm test`)
  - [x] Interactive OpenAPI / Swagger UI (`/api-docs`)
  - [x] Exportable Postman collection (`postman_collection.json`)
  - [x] Docker setup (`Dockerfile`, `docker-compose.yml`)
  - [x] Rate limiting (`express-rate-limit`)
  - [x] Request logging (`morgan`)
  - [x] Database indexing on slugs, ancestors, categories, status, text search
  - [x] Modern React frontend with customer storefront and administrative management portal
