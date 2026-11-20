# 📖 E-Commerce REST API — Swagger & Endpoint Documentation

> **Interactive Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)  
> **Raw OpenAPI 3.0 JSON**: [http://localhost:5000/api-docs/swagger.json](http://localhost:5000/api-docs/swagger.json)  
> **Base URL**: `http://localhost:5000`

---

## 📑 Table of Contents
1. [Authentication & Authorization](#1-authentication--authorization)
2. [User Management (Admin)](#2-user-management-admin)
3. [Multi-Level Categories](#3-multi-level-categories)
4. [Product Management](#4-product-management)
5. [Shopping Cart (Guest & Authenticated)](#5-shopping-cart-guest--authenticated)
6. [Order Management & Checkout](#6-order-management--checkout)
7. [File & Image Uploads](#7-file--image-uploads)
8. [Standard Response & Error Codes](#8-standard-response--error-codes)

---

## 1. Authentication & Authorization

All protected endpoints require a JWT Bearer token:
```http
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting:
- `POST /api/auth/login` and `POST /api/auth/register` are protected by rate limiting (**5 attempts per 15 minutes**).
- Exceeding the limit returns `429 Too Many Requests`.

---

### `POST /api/auth/register`
Create a new customer account.

- **Access**: Public
- **Request Body**:
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "Password@123",
  "phone": "+91 9876543210"
}
```
> *Note: Public registration strictly creates `customer` role accounts to prevent privilege escalation.*

- **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "673f1a2b3c4d5e6f7a8b9c0d",
      "name": "Priya Sharma",
      "email": "priya@example.com",
      "role": "customer",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `POST /api/auth/login`
Authenticate with email and password.

- **Access**: Public (Rate limited: 5 attempts / 15 mins)
- **Request Body**:
```json
{
  "email": "customer@ecommerce.com",
  "password": "Customer@1234"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "673f1a2b3c4d5e6f7a8b9c0d",
      "name": "Priya Sharma",
      "email": "customer@ecommerce.com",
      "role": "customer",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `GET /api/auth/me` (or `/api/auth/profile`)
Get profile details of the currently authenticated user.

- **Access**: Authenticated (`customer` or `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "673f1a2b3c4d5e6f7a8b9c0d",
    "name": "Priya Sharma",
    "email": "customer@ecommerce.com",
    "role": "customer",
    "addresses": [
      {
        "_id": "673f1a2b3c4d5e6f7a8b9c0e",
        "fullName": "Priya Sharma",
        "phone": "+91 9876543210",
        "street": "124 Lotus Boulevard",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "zipCode": "201304",
        "country": "India",
        "isDefault": true
      }
    ]
  }
}
```

---

### `PUT /api/auth/profile`
Update name, phone, or address list.

- **Access**: Authenticated
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Priya Sharma",
  "phone": "+91 9999900000"
}
```

---

## 2. User Management (Admin)

### `GET /api/users`
List all users with pagination, text search, role filter, and status filter.

- **Access**: Admin only (`role: admin`)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `limit` (integer, default: 10)
  - `search` (string, matches name or email)
  - `role` (enum: `customer` | `admin`)
  - `isActive` (boolean: `true` | `false`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "673f1a...",
      "name": "Priya Sharma",
      "email": "customer@ecommerce.com",
      "role": "customer",
      "isActive": true,
      "createdAt": "2026-11-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### `PATCH /api/users/:id/status`
Activate or deactivate a user account. Deactivated users cannot log in or make API calls.

- **Access**: Admin only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "isActive": false
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "_id": "673f1a...",
    "isActive": false
  }
}
```

---

## 3. Multi-Level Categories

Categories support **arbitrary infinite nesting depth** via an indexed `ancestors` array.

```text
Electronics (Root)
└── Mobiles
    ├── Android Phones
    │   ├── Samsung
    │   └── OnePlus
    └── iPhones
```

### `GET /api/categories/tree`
Fetch the complete recursive category tree hierarchy.

- **Access**: Public
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "673f20...",
      "name": "Electronics",
      "slug": "electronics",
      "parentId": null,
      "children": [
        {
          "_id": "673f21...",
          "name": "Mobiles",
          "slug": "mobiles",
          "parentId": "673f20...",
          "children": [
            {
              "_id": "673f22...",
              "name": "Android Phones",
              "slug": "android-phones",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

---

### `GET /api/categories`
Get flat list of categories or nested tree when `?tree=true`.

- **Access**: Public
- **Query Parameters**:
  - `tree=true`: returns nested tree format.
  - `parentId=<id>`: returns immediate children of specific parent.

---

### `POST /api/categories`
Create a new category (root or subcategory).

- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Laptops",
  "parentId": "673f20b...",
  "description": "High performance ultrabooks and gaming rigs"
}
```

---

### `PUT /api/categories/:id`
Update category name, description, or parent category.

- **Access**: Admin only
- **Protection**: Strictly detects and prevents circular dependencies:
  1. Category cannot be its own parent.
  2. Category cannot select any of its own descendants as its parent.
- **Error Response on Cycle (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Circular dependency detected: A category cannot be a child of its own descendant"
}
```

---

### `DELETE /api/categories/:id`
Delete a category.

- **Access**: Admin only
- **Protection**: Rejects deletion if subcategories or products are linked to it.

---

## 4. Product Management

### `GET /api/products`
Search and filter products across the catalog.

- **Access**: Public
- **Query Parameters**:
  - `category` (string, slug or ObjectId): **Deep Descendant Filtering** — Returns products in this category **AND all its recursive subcategories**.
  - `search` (string): Case-insensitive regex matching `name`, `sku`, or `description`.
  - `minPrice` / `maxPrice` (number): Filters effective sale price.
  - `sort`: `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`.
  - `page` (default: 1), `limit` (default: 12).
- **Example Request**:
```http
GET /api/products?category=electronics&minPrice=10000&maxPrice=50000&sort=price_asc&page=1
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "673f30...",
      "name": "Samsung Galaxy S24 Ultra",
      "sku": "SAM-S24U-256",
      "slug": "samsung-galaxy-s24-ultra",
      "description": "Flagship 200MP camera smartphone",
      "price": 129999,
      "salePrice": 119999,
      "stock": 45,
      "category": {
        "_id": "673f22...",
        "name": "Android Phones",
        "slug": "android-phones"
      },
      "images": [
        "https://res.cloudinary.com/.../s24.jpg"
      ],
      "status": "active"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 12,
    "totalPages": 1
  }
}
```

---

### `GET /api/products/:id`
Fetch single product with populated category hierarchy breadcrumbs.

- **Access**: Public
- **Parameter**: `:id` (ObjectId or slug)

---

### `POST /api/products`
Create a new product.

- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "OnePlus 12 5G",
  "sku": "OP-12-512GB",
  "description": "Snapdragon 8 Gen 3 flagship with Hasselblad camera",
  "price": 69999,
  "salePrice": 64999,
  "stock": 25,
  "category": "673f22...",
  "status": "active",
  "images": ["/uploads/products/oneplus12.png"]
}
```

---

### `PUT /api/products/:id`
Update an existing product.

- **Access**: Admin only

---

### `DELETE /api/products/:id`
Delete product and automatically purge associated image files from Cloudinary or local `/uploads`.

- **Access**: Admin only

---

## 5. Shopping Cart (Guest & Authenticated)

Supports both authenticated customers and guest shoppers using the `x-guest-token` header.

### `GET /api/cart`
Retrieve current cart items with real-time price calculations and available stock.

- **Headers**: `Authorization: Bearer <token>` OR `x-guest-token: <uuid>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "673f40...",
    "items": [
      {
        "product": {
          "_id": "673f30...",
          "name": "Samsung Galaxy S24 Ultra",
          "price": 129999,
          "salePrice": 119999,
          "stock": 45,
          "images": ["..."]
        },
        "quantity": 1,
        "price": 119999,
        "subtotal": 119999
      }
    ],
    "subtotal": 119999,
    "totalItems": 1
  }
}
```

---

### `POST /api/cart/items`
Add an item to the cart (enforces available stock check).

- **Request Body**:
```json
{
  "productId": "673f30...",
  "quantity": 2
}
```

---

### `PUT /api/cart/items/:productId`
Update item quantity. Passing quantity `0` removes the item.

```json
{
  "quantity": 3
}
```

---

### `POST /api/cart/merge`
Merges guest cart items into user's account cart upon login/registration.

- **Headers**:
  - `Authorization: Bearer <customer_token>`
  - `x-guest-token: <guest_uuid>`

---

## 6. Order Management & Checkout

### `POST /api/orders`
Place a new order.

- **Access**: Customer only (`role: customer`)
- **Backend Guarantees**:
  - Frontend prices are **never trusted**; all totals, taxes (GST 5%), and shipping fees are calculated on the backend.
  - Stock is atomically checked and decremented. If insufficient, returns `400 Bad Request` specifying the depleted item.
- **Request Body**:
```json
{
  "items": [
    {
      "productId": "673f30...",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "Priya Sharma",
    "phone": "+91 9876543210",
    "street": "124 Lotus Boulevard",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "zipCode": "201304",
    "country": "India"
  },
  "paymentMethod": "COD"
}
```

---

### `GET /api/orders/my-orders`
List all orders placed by the currently logged-in customer.

- **Access**: Customer only

---

### `GET /api/orders/:id`
View full order details, shipping address, invoice breakdown, and status timeline.

- **Access**: Customer (own orders) or Admin (any order)

---

### `GET /api/orders`
List all orders with status filter and pagination.

- **Access**: Admin only
- **Query Parameters**: `status` (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), `page`, `limit`.

---

### `PATCH /api/orders/:id/status`
Update order lifecycle status.

- **Access**: Admin only
- **Status State Machine**:
  `Pending` &rarr; `Confirmed` &rarr; `Processing` &rarr; `Shipped` &rarr; `Delivered` (or `Cancelled`)
- **Stock Restoration**:
  Transitioning to `Cancelled` automatically executes MongoDB `$inc` to **restore reserved quantities back into inventory**.
- **Request Body**:
```json
{
  "status": "Confirmed",
  "note": "Payment verified via online gateway"
}
```

---

## 7. File & Image Uploads

### `POST /api/upload/image`
Upload product or category images.

- **Access**: Admin only
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `image` (File, max size configurable via `MAX_IMAGE_SIZE_MB`, default 5MB)
- **Environment Strategy**:
  - `NODE_ENV=development`: Stored locally in root `/uploads/` directory.
  - `NODE_ENV=production`: Uploaded directly to Cloudinary with `auto:good` compression.
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "url": "http://localhost:5000/uploads/image-179519.webp",
    "publicId": "testround/products/abc123"
  }
}
```

---

## 8. Standard Response & Error Codes

Every response follows the unified JSON envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message description",
  "data": {}
}
```

### HTTP Status Codes:
| Status Code | Description | Scenario |
| :--- | :--- | :--- |
| **200 OK** | Request succeeded | Successful GET, PUT, PATCH |
| **201 Created** | Resource created | Successful Registration, Order, Product, Category |
| **400 Bad Request** | Validation failed | Depleted stock, invalid payload, circular category hierarchy |
| **401 Unauthorized** | Missing or invalid token | Unauthenticated request to protected endpoint |
| **403 Forbidden** | Role restriction | Customer attempting Admin action or deactivated account |
| **404 Not Found** | Resource missing | Product, category, or order ID does not exist |
| **429 Too Many Requests** | Rate limit exceeded | Exceeded 5 login/register attempts within 15 minutes |
| **500 Internal Error** | Server exception | Unhandled database or system fault |
