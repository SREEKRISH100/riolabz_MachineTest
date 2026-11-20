// OpenAPI 3.0 specification definition for E-commerce REST API
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'E-commerce REST API',
    version: '1.0.0',
    description: `
### Mid-Level Node.js Developer Machine Test
Comprehensive REST API for a high-performance E-commerce platform built with Node.js, Express.js, MongoDB/Mongoose, and JWT authentication.

#### Key Features:
- **User Management**: Registration, JWT Authentication, Customer & Admin Roles, Profile, Admin User Activation/Deactivation.
- **Multi-Level Category Hierarchy**: Infinite nesting depth, parent-child relationships, circular dependency prevention, complete tree endpoint.
- **Product Management**: Search, Multi-Level Category Descendant Filtering, Price Filtering, Sorting, Pagination, Admin CRUD.
- **Order Management**: Backend price calculation, atomic stock validation & decrement, order status workflow (Pending → Confirmed → Processing → Shipped → Delivered / Cancelled), automatic stock restore on cancellation.
- **Guest & User Cart**: Guest token session, atomic stock checks, auto cart merge upon login.
    `,
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'integer' },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['customer', 'admin'] },
          isActive: { type: 'boolean' },
          phone: { type: 'string' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          parentId: { type: 'string', nullable: true },
          ancestors: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          sku: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          salePrice: { type: 'number', nullable: true },
          stock: { type: 'integer' },
          category: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          orderNumber: { type: 'string' },
          customer: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product: { type: 'string' },
                name: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'integer' },
                subtotal: { type: 'number' },
              },
            },
          },
          totalAmount: { type: 'number' },
          status: {
            type: 'string',
            enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
          },
          statusHistory: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new customer or admin',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Rahul Sharma' },
                  email: { type: 'string', example: 'rahul@example.com' },
                  password: { type: 'string', example: 'SecurePassword123' },
                  role: { type: 'string', enum: ['customer', 'admin'], default: 'customer' },
                  phone: { type: 'string', example: '+91 9876543210' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User registered successfully' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in with email and password',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'customer@ecommerce.com' },
                  password: { type: 'string', example: 'Customer@1234' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'JWT token returned' } },
      },
    },
    '/api/auth/profile': {
      get: {
        summary: 'Get current user profile',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User profile object' } },
      },
      put: {
        summary: 'Update current user profile',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Updated profile object' } },
      },
    },
    '/api/users': {
      get: {
        summary: 'Admin list all users with pagination and search',
        tags: ['Users (Admin)'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string' } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Paginated user list' } },
      },
    },
    '/api/users/{id}/status': {
      patch: {
        summary: 'Admin activate or deactivate user',
        tags: ['Users (Admin)'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean' } },
              },
            },
          },
        },
        responses: { 200: { description: 'User status updated' } },
      },
    },
    '/api/categories': {
      get: {
        summary: 'Get all categories or nested tree (?tree=true)',
        tags: ['Categories'],
        parameters: [
          { name: 'tree', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: { 200: { description: 'List of categories or tree' } },
      },
      post: {
        summary: 'Admin create a category (multi-level hierarchy)',
        tags: ['Categories (Admin)'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Laptops' },
                  parentId: { type: 'string', example: '60d0fe4f5311236168a109ca', nullable: true },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Category created' } },
      },
    },
    '/api/categories/tree': {
      get: {
        summary: 'Return complete category hierarchy tree',
        tags: ['Categories'],
        responses: { 200: { description: 'Complete category hierarchy' } },
      },
    },
    '/api/categories/{id}': {
      put: {
        summary: 'Admin update category (with circular relationship validation)',
        tags: ['Categories (Admin)'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Category updated' } },
      },
      delete: {
        summary: 'Admin delete category (prevents deletion if has subcategories/products)',
        tags: ['Categories (Admin)'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Category deleted' } },
      },
    },
    '/api/products': {
      get: {
        summary: 'List products (search, multi-level category filter, price, sort, pagination)',
        tags: ['Products'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category ID or slug; returns products in this category AND all its subcategories' },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: { 200: { description: 'Paginated product list' } },
      },
      post: {
        summary: 'Admin create product',
        tags: ['Products (Admin)'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'sku', 'description', 'price', 'stock', 'category'],
                properties: {
                  name: { type: 'string', example: 'Samsung Galaxy S24 Ultra' },
                  sku: { type: 'string', example: 'SAM-S24U-256' },
                  description: { type: 'string', example: 'Flagship smartphone with Snapdragon 8 Gen 3' },
                  price: { type: 'number', example: 129999 },
                  salePrice: { type: 'number', example: 119999 },
                  stock: { type: 'integer', example: 45 },
                  category: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                  status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/api/orders': {
      post: {
        summary: 'Authenticated customer place order (backend price calc & atomic stock reduction)',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items', 'shippingAddress'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'quantity'],
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1 },
                      },
                    },
                  },
                  shippingAddress: {
                    type: 'object',
                    required: ['fullName', 'phone', 'street', 'city', 'state', 'zipCode'],
                    properties: {
                      fullName: { type: 'string' },
                      phone: { type: 'string' },
                      street: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      zipCode: { type: 'string' },
                      country: { type: 'string', default: 'India' },
                    },
                  },
                  paymentMethod: { type: 'string', enum: ['COD', 'Card', 'Mock_Payment'], default: 'COD' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Order created' } },
      },
      get: {
        summary: 'Admin view all orders with pagination & status filter',
        tags: ['Orders (Admin)'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paginated order list' } },
      },
    },
    '/api/orders/my-orders': {
      get: {
        summary: 'Customer view own orders',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Customer order history' } },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        summary: 'Admin update order status (restores stock if Cancelled)',
        tags: ['Orders (Admin)'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
                  },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Order status updated' } },
      },
    },
  },
};

const renderSwaggerHTML = (specUrl = '/api-docs/swagger.json') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>E-commerce REST API Docs (OpenAPI 3.0)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
  <style>
    body { margin: 0; padding: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .topbar { display: none; }
    .custom-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .custom-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .custom-header p { margin: 5px 0 0 0; color: #94a3b8; font-size: 14px; }
    .badge {
      background: #3b82f6;
      color: white;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <div>
      <h1>E-Commerce REST API Documentation</h1>
      <p>Node.js, Express, MongoDB/Mongoose, JWT Auth & Multi-Level Category Tree</p>
    </div>
    <div>
      <span class="badge">OpenAPI 3.0</span>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
`;

module.exports = { swaggerSpec, renderSwaggerHTML };
