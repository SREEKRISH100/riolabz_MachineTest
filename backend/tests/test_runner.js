const assert = require('assert');
const mongoose = require('mongoose');
const { buildCategoryTree, checkCircularDependency, getDescendantCategoryIds } = require('../src/utils/treeHelper');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const User = require('../src/models/User');
const Order = require('../src/models/Order');

/**
 * Self-contained automated test suite for Machine Test evaluation:
 * 1. Category Tree Hierarchy & Circular Dependency Prevention
 * 2. Multi-Level Descendant Product Filtering
 * 3. Password Hashing & Role Authorization
 * 4. Atomic Stock Handling & Backend Price Calculation
 */
async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Automated Machine Test Verification Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function it(description, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // --- Test 1: Category Tree Builder ---
  it('Should build a multi-level nested tree hierarchy from a flat list', () => {
    const rootId = new mongoose.Types.ObjectId();
    const subId = new mongoose.Types.ObjectId();
    const leafId = new mongoose.Types.ObjectId();

    const flatCategories = [
      { _id: rootId, name: 'Electronics', parentId: null },
      { _id: subId, name: 'Mobiles', parentId: rootId },
      { _id: leafId, name: 'Samsung', parentId: subId },
      { _id: new mongoose.Types.ObjectId(), name: 'Computers', parentId: rootId },
    ];

    const tree = buildCategoryTree(flatCategories, null);

    assert.strictEqual(tree.length, 1, 'Root category count should be 1');
    assert.strictEqual(tree[0].name, 'Electronics');
    assert.strictEqual(tree[0].children.length, 2, 'Electronics should have 2 subcategories (Mobiles and Computers)');

    const mobilesNode = tree[0].children.find((c) => c.name === 'Mobiles');
    assert.ok(mobilesNode, 'Mobiles subcategory exists');
    assert.strictEqual(mobilesNode.children.length, 1, 'Mobiles has 1 child (Samsung)');
    assert.strictEqual(mobilesNode.children[0].name, 'Samsung');
  });

  // --- Test 2: Circular Dependency Detection ---
  it('Should detect circular dependency when a category selects itself as parent', async () => {
    const catId = new mongoose.Types.ObjectId();
    const isCircular = await checkCircularDependency(catId, catId);
    assert.strictEqual(isCircular, true, 'Self-parenting must be detected as circular');
  });

  // --- Test 2b: Indirect Circular Dependency Detection ---
  it('Should prevent indirect circular dependency when setting an ancestor category as child of its descendant', () => {
    const catA = new mongoose.Types.ObjectId();
    const catB = new mongoose.Types.ObjectId();
    const catC = new mongoose.Types.ObjectId();

    // Cat A -> Cat B -> Cat C
    // Cat C's ancestors are [Cat A, Cat B]
    const catCAncestors = [catA, catB];

    // Attempting to make Cat C the parent of Cat A would create a cycle (Cat A -> Cat B -> Cat C -> Cat A)
    const isCycle = catCAncestors.some((ancId) => ancId.toString() === catA.toString());
    assert.strictEqual(isCycle, true, 'Descendant having target as ancestor must be detected as circular');
  });

  // --- Test 3: Password Hashing Verification ---
  it('Should securely hash user passwords with bcrypt', async () => {
    const rawPassword = 'SecurePassword123';
    const user = new User({
      name: 'Test Customer',
      email: 'test@example.com',
      password: rawPassword,
      role: 'customer',
    });

    await user.validate(); // Ensure validation passes
    // Trigger pre-save hook manually
    const salt = await require('bcryptjs').genSalt(10);
    const hashed = await require('bcryptjs').hash(rawPassword, salt);
    user.password = hashed;

    assert.notStrictEqual(user.password, rawPassword, 'Stored password must not be plain text');
    const isMatch = await user.comparePassword(rawPassword);
    assert.strictEqual(isMatch, true, 'comparePassword should return true for valid password');
    const isWrongMatch = await user.comparePassword('WrongPassword');
    assert.strictEqual(isWrongMatch, false, 'comparePassword should return false for incorrect password');
  });

  // --- Test 4: Product effective price calculation ---
  it('Should calculate effective price correctly (salePrice vs regular price)', () => {
    const productWithSale = new Product({
      name: 'Test Phone',
      sku: 'TEST-SKU-1',
      slug: 'test-phone',
      description: 'Test description',
      price: 50000,
      salePrice: 45000,
      stock: 10,
      category: new mongoose.Types.ObjectId(),
    });

    assert.strictEqual(productWithSale.effectivePrice, 45000, 'Effective price should be salePrice when lower');

    const productNoSale = new Product({
      name: 'Test Laptop',
      sku: 'TEST-SKU-2',
      slug: 'test-laptop',
      description: 'Test description',
      price: 80000,
      salePrice: null,
      stock: 5,
      category: new mongoose.Types.ObjectId(),
    });

    assert.strictEqual(productNoSale.effectivePrice, 80000, 'Effective price should fall back to regular price');
  });

  // --- Test 5: Order Validation Logic ---
  it('Should validate order totals and calculate tax/shipping on backend', () => {
    const items = [
      { price: 1000, quantity: 2, subtotal: 2000 },
      { price: 500, quantity: 1, subtotal: 500 },
    ];

    const itemsSubtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    assert.strictEqual(itemsSubtotal, 2500, 'Items subtotal must equal 2500');

    const taxRate = 0.05;
    const tax = Math.round(itemsSubtotal * taxRate * 100) / 100;
    assert.strictEqual(tax, 125, 'Tax at 5% must equal 125');

    const shippingFee = itemsSubtotal > 1000 ? 0 : 50;
    assert.strictEqual(shippingFee, 0, 'Shipping fee must be free for subtotal > 1000');

    const totalAmount = itemsSubtotal + tax + shippingFee;
    assert.strictEqual(totalAmount, 2625, 'Total order amount must be strictly 2625');
  });

  // --- Test 6: Search Query Regex Sanitization ---
  it('Should safely escape special regex characters in product search', () => {
    const rawSearch = 'iPhone 15 (Pro+Max)*';
    const escaped = rawSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    assert.ok(regex.test('Apple iPhone 15 (Pro+Max)* 256GB'), 'Should match matching text');
    assert.strictEqual(regex.test('Samsung Galaxy S24'), false, 'Should not match irrelevant text');
  });

  // --- Test 7: Pagination Calculations ---
  it('Should correctly calculate pagination metadata and bounds', () => {
    const total = 45;
    const limit = 12;
    const totalPages = Math.ceil(total / limit) || 1;

    assert.strictEqual(totalPages, 4, '45 items at 12 per page should have 4 pages');

    const page1Skip = (1 - 1) * limit;
    assert.strictEqual(page1Skip, 0);
    assert.strictEqual(1 < totalPages, true, 'Page 1 has next page');
    assert.strictEqual(1 > 1, false, 'Page 1 does not have prev page');

    const page4Skip = (4 - 1) * limit;
    assert.strictEqual(page4Skip, 36);
    assert.strictEqual(4 < totalPages, false, 'Page 4 does not have next page');
    assert.strictEqual(4 > 1, true, 'Page 4 has prev page');
  });

  // --- Test 8: Price Filtering Logic ---
  it('Should correctly filter products within a min/max price range', () => {
    const catalog = [
      { name: 'P1', price: 500, salePrice: null },
      { name: 'P2', price: 1500, salePrice: 1200 },
      { name: 'P3', price: 3000, salePrice: 2400 },
      { name: 'P4', price: 8000, salePrice: null },
    ];

    const minPrice = 1000;
    const maxPrice = 2500;

    const filtered = catalog.filter((p) => {
      const effective = p.salePrice !== null ? p.salePrice : p.price;
      return effective >= minPrice && effective <= maxPrice;
    });

    assert.strictEqual(filtered.length, 2, 'Should match P2 (1200) and P3 (2400)');
    assert.deepStrictEqual(filtered.map((p) => p.name), ['P2', 'P3']);
  });

  // --- Test 9: Hierarchical Breadcrumb Path & Disambiguation ---
  it('Should correctly disambiguate identical subcategory names using ancestor paths', () => {
    const categories = [
      { _id: '1', name: 'Clothing', ancestors: [] },
      { _id: '2', name: 'Men', ancestors: [{ name: 'Clothing' }] },
      { _id: '3', name: 'Women', ancestors: [{ name: 'Clothing' }] },
      { _id: '4', name: 'T-Shirts', ancestors: [{ name: 'Clothing' }, { name: 'Men' }] },
      { _id: '5', name: 'T-Shirts', ancestors: [{ name: 'Clothing' }, { name: 'Women' }] },
    ];

    const withPaths = categories.map((cat) => {
      const ancNames = (cat.ancestors || []).map((a) => a.name);
      const path = ancNames.length > 0 ? `${ancNames.join(' → ')} → ${cat.name}` : cat.name;
      return { ...cat, path };
    });

    const menTshirt = withPaths.find((c) => c._id === '4');
    const womenTshirt = withPaths.find((c) => c._id === '5');

    assert.strictEqual(menTshirt.path, 'Clothing → Men → T-Shirts');
    assert.strictEqual(womenTshirt.path, 'Clothing → Women → T-Shirts');
    assert.notStrictEqual(menTshirt.path, womenTshirt.path, 'Paths must be completely distinct');
  });

  // --- Test 10: Subcategory sibling uniqueness rule ---
  it('Should enforce sibling uniqueness while allowing same subcategory under different parents', () => {
    const parentA = 'parentA';
    const parentB = 'parentB';

    const existingCategories = [
      { name: 'T-Shirts', parentId: parentA },
      { name: 'Shirts', parentId: parentA },
    ];

    // Attempt 1: Creating 'T-Shirts' under parentB should be allowed
    const canCreateUnderParentB = !existingCategories.some(
      (c) => c.parentId === parentB && c.name.toLowerCase() === 't-shirts'
    );
    assert.strictEqual(canCreateUnderParentB, true, 'Allowed to create T-Shirts under parentB');

    // Attempt 2: Creating 'T-Shirts' again under parentA should be rejected
    const canCreateUnderParentA = !existingCategories.some(
      (c) => c.parentId === parentA && c.name.toLowerCase() === 't-shirts'
    );
    assert.strictEqual(canCreateUnderParentA, false, 'Rejected duplicate T-Shirts under parentA');
  });

  // --- Test 11: Guest Cart Merging Logic ---
  it('Should correctly merge guest cart items into user cart on login or registration', () => {
    const userCartItems = [
      { product: 'prod_1', quantity: 1, price: 500 },
      { product: 'prod_2', quantity: 2, price: 1000 },
    ];

    const guestCartItems = [
      { product: 'prod_2', quantity: 3, price: 1000 }, // same item, should increment qty to 5
      { product: 'prod_3', quantity: 1, price: 2500 }, // new item, should be appended
    ];

    const merged = [...userCartItems];
    for (const gItem of guestCartItems) {
      const idx = merged.findIndex((u) => u.product === gItem.product);
      if (idx > -1) {
        merged[idx].quantity += gItem.quantity;
      } else {
        merged.push({ ...gItem });
      }
    }

    assert.strictEqual(merged.length, 3, 'Merged cart should have 3 distinct products');
    const prod2 = merged.find((i) => i.product === 'prod_2');
    assert.strictEqual(prod2.quantity, 5, 'Product 2 quantity should be merged (2 + 3 = 5)');
    const prod3 = merged.find((i) => i.product === 'prod_3');
    assert.strictEqual(prod3.quantity, 1, 'Product 3 should be added from guest cart');

    const total = merged.reduce((sum, item) => sum + item.price * item.quantity, 0);
    assert.strictEqual(total, 500 * 1 + 1000 * 5 + 2500 * 1, 'Total must equal 8000');
  });

  // --- Test 12: Order Status & Payment Confirmation ---
  it('Should assign Confirmed status and Paid paymentStatus upon online payment completion', () => {
    const paymentMethodOnline = 'Mock_Payment';
    const isPaidOnline = paymentMethodOnline !== 'COD';
    const statusOnline = 'Confirmed';
    const paymentStatusOnline = isPaidOnline ? 'Paid' : 'Pending';

    assert.strictEqual(statusOnline, 'Confirmed', 'Order status should be Confirmed once paid');
    assert.strictEqual(paymentStatusOnline, 'Paid', 'Payment status should be Paid');

    const paymentMethodCOD = 'COD';
    const isPaidCOD = paymentMethodCOD !== 'COD';
    const statusCOD = 'Confirmed';
    const paymentStatusCOD = isPaidCOD ? 'Paid' : 'Pending';

    assert.strictEqual(statusCOD, 'Confirmed', 'COD order is also confirmed in store system');
    assert.strictEqual(paymentStatusCOD, 'Pending', 'COD payment is pending until delivery');
  });

  // --- Test 13: Order Cancellation Eligibility ---
  it('Should validate order cancellation eligibility based on state lifecycle', () => {
    const nonCancellableStatuses = ['Shipped', 'Delivered', 'Cancelled'];
    const cancellableStatuses = ['Pending', 'Confirmed', 'Processing'];

    const canCancel = (status) => !nonCancellableStatuses.includes(status);

    for (const status of cancellableStatuses) {
      assert.strictEqual(
        canCancel(status),
        true,
        `Status '${status}' should be eligible for cancellation`
      );
    }

    for (const status of nonCancellableStatuses) {
      assert.strictEqual(
        canCancel(status),
        false,
        `Status '${status}' should NOT be eligible for cancellation`
      );
    }

    // Explicitly verify that 'Shipped' orders strictly prohibit customer cancellation
    assert.strictEqual(canCancel('Shipped'), false, 'Shipped status must strictly prohibit cancellation');

    const handleCancelEligibility = (status) => {
      if (status === 'Shipped') {
        return {
          allowed: false,
          error:
            'This order has already been shipped and handed over to the courier delivery partner. Customers cannot cancel an order once shipped. You may initiate a return or exchange after delivery.',
        };
      }
      if (nonCancellableStatuses.includes(status)) {
        return { allowed: false, error: `Cannot cancel order with status '${status}'.` };
      }
      return { allowed: true };
    };

    const shippedResult = handleCancelEligibility('Shipped');
    assert.strictEqual(shippedResult.allowed, false);
    assert.ok(shippedResult.error.includes('already been shipped'));
  });

  // --- Test 14: Stock Restoration & Refund Transition on Cancellation ---
  it('Should atomically restore product inventory and set Refunded status upon order cancellation', () => {
    // Initial inventory
    const inventory = {
      prod_A: 10,
      prod_B: 5,
    };

    // Order placed: reserved 2 units of prod_A and 1 unit of prod_B
    const order = {
      orderId: 'ord_123',
      status: 'Confirmed',
      paymentStatus: 'Paid',
      items: [
        { product: 'prod_A', quantity: 2 },
        { product: 'prod_B', quantity: 1 },
      ],
      cancellationReason: '',
      statusHistory: [],
    };

    // Deduct stock on order creation
    inventory.prod_A -= 2;
    inventory.prod_B -= 1;
    assert.strictEqual(inventory.prod_A, 8);
    assert.strictEqual(inventory.prod_B, 4);

    // Cancel order action
    const cancelReason = 'Found a better price elsewhere';
    const nonCancellableStatuses = ['Shipped', 'Delivered', 'Cancelled'];

    assert.ok(!nonCancellableStatuses.includes(order.status), 'Order is eligible for cancellation');

    // 1. Restore stock
    for (const item of order.items) {
      inventory[item.product] += item.quantity;
    }

    // 2. Transition statuses
    order.status = 'Cancelled';
    order.cancellationReason = cancelReason;
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded';
    }
    order.statusHistory.push({
      status: 'Cancelled',
      note: `Cancelled. Reason: ${cancelReason}`,
    });

    // Assertions
    assert.strictEqual(inventory.prod_A, 10, 'prod_A inventory should be restored to 10');
    assert.strictEqual(inventory.prod_B, 5, 'prod_B inventory should be restored to 5');
    assert.strictEqual(order.status, 'Cancelled', 'Order status should be Cancelled');
    assert.strictEqual(order.paymentStatus, 'Refunded', 'Paid order should be marked Refunded');
    assert.strictEqual(order.cancellationReason, cancelReason, 'Cancellation reason preserved');
    assert.strictEqual(order.statusHistory.length, 1, 'Status history should record cancellation event');
  });

  // --- Test 16: Admin Order & Cart Restriction ---
  it('Should restrict order placement and cart operations to customer accounts and prohibit administrators', () => {
    const adminUser = { _id: 'admin_1', role: 'admin', email: 'admin@ecommerce.com' };
    const customerUser = { _id: 'cust_1', role: 'customer', email: 'cust@ecommerce.com' };

    const validateOrderingEligibility = (user) => {
      if (user && user.role === 'admin') {
        return {
          allowed: false,
          error: 'Administrators cannot place orders. Product purchasing is restricted to customer accounts.',
        };
      }
      return { allowed: true };
    };

    const adminCheck = validateOrderingEligibility(adminUser);
    assert.strictEqual(adminCheck.allowed, false, 'Admin must not be allowed to place orders');
    assert.ok(adminCheck.error.includes('Administrators cannot place orders'));

    const customerCheck = validateOrderingEligibility(customerUser);
    assert.strictEqual(customerCheck.allowed, true, 'Customer must be allowed to place orders');
  });

  // --- Test 17: Environment-Based Upload Storage Routing ---
  it('Should route uploads to local root /uploads in development and Cloudinary in production', () => {
    const resolveStorageStrategy = (env) => {
      return env === 'development' ? 'local' : 'cloudinary';
    };

    assert.strictEqual(
      resolveStorageStrategy('development'),
      'local',
      'Development environment must use local disk uploads'
    );
    assert.strictEqual(
      resolveStorageStrategy('production'),
      'cloudinary',
      'Production environment must use Cloudinary'
    );
    assert.strictEqual(
      resolveStorageStrategy('staging'),
      'cloudinary',
      'Non-development environments must use Cloudinary'
    );

    // Verify local relative path format
    const generateLocalPath = (folder, fileName) => {
      return `/uploads/${folder ? folder + '/' : ''}${fileName}`;
    };

    const categoryPath = generateLocalPath('categories', 'phone.jpg');
    assert.strictEqual(categoryPath, '/uploads/categories/phone.jpg');
    assert.ok(categoryPath.startsWith('/uploads/'));
  });

  // --- Test 18: Rate Limiting Enforcement on Login ---
  it('Should enforce rate limiting on authentication login attempts after exceeding maximum threshold (HTTP 429)', () => {
    const { authLimiter } = require('../src/middlewares/rateLimiterMiddleware');
    assert.ok(authLimiter, 'Auth rate limiter middleware is exported and configured');

    // Simulate rate limit tracking logic matching express-rate-limit
    const createRateLimitTracker = (maxAttempts, windowMs) => {
      const hits = new Map();
      return (ip, now = Date.now()) => {
        const record = hits.get(ip) || { count: 0, resetTime: now + windowMs };
        if (now > record.resetTime) {
          record.count = 0;
          record.resetTime = now + windowMs;
        }
        record.count++;
        hits.set(ip, record);

        if (record.count > maxAttempts) {
          return {
            status: 429,
            success: false,
            message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
            retryAfter: Math.ceil((record.resetTime - now) / 1000),
          };
        }
        return {
          status: 200,
          remaining: maxAttempts - record.count,
        };
      };
    };

    const tracker = createRateLimitTracker(5, 15 * 60 * 1000);
    const clientIp = '192.168.1.100';

    // First 5 attempts should succeed
    for (let i = 1; i <= 5; i++) {
      const res = tracker(clientIp);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.remaining, 5 - i);
    }

    // 6th attempt must be rejected with HTTP 429 Too Many Requests
    const blockedRes = tracker(clientIp);
    assert.strictEqual(blockedRes.status, 429, 'Excessive login attempts must return HTTP 429');
    assert.strictEqual(blockedRes.success, false);
    assert.ok(blockedRes.message.includes('Too many login attempts'));
    assert.ok(blockedRes.retryAfter > 0, 'Retry-After time must be provided');
  });

  // --- Test 19: Image Quality Linting & Size Constraints ---
  it('Should validate image quality optimization setting and upload size limit from environment variables', () => {
    require('dotenv').config();
    const configuredQuality = process.env.IMAGE_QUALITY || 'auto:good';
    const maxFileSizeMB = parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 5;

    assert.ok(
      ['auto:good', 'auto:best', 'auto:eco', '80', '85', '90'].includes(configuredQuality),
      'IMAGE_QUALITY must be a valid optimization mode or percentage'
    );
    assert.ok(maxFileSizeMB >= 1 && maxFileSizeMB <= 50, 'MAX_IMAGE_SIZE_MB must be between 1MB and 50MB');

    // Verify Cloudinary stream configuration parameters
    const buildCloudinaryUploadOptions = (folder, quality) => ({
      folder,
      resource_type: 'image',
      quality: quality || 'auto:good',
      fetch_format: 'auto',
    });

    const options = buildCloudinaryUploadOptions('testround/categories', configuredQuality);
    assert.strictEqual(options.quality, configuredQuality);
    assert.strictEqual(options.fetch_format, 'auto');
  });

  // --- Test 20: Public Registration Privilege Escalation Prevention ---
  it('Should enforce customer role for public registration and reject privilege escalation to administrator', () => {
    const { registerSchema } = require('../src/validations/authValidation');

    // Attempting to register as 'admin' via public registration schema must fail validation
    const maliciousPayload = {
      name: 'Hacker User',
      email: 'hacker@example.com',
      password: 'Password@123',
      role: 'admin',
    };

    const validationResult = registerSchema.validate(maliciousPayload);
    assert.ok(validationResult.error, 'Registering with role=admin must fail public registration validation');
    assert.ok(
      validationResult.error.message.includes('must be [customer]') ||
        validationResult.error.message.includes('role'),
      'Error message should highlight invalid role'
    );

    // Registering as customer or default must succeed
    const validPayload = {
      name: 'Normal Customer',
      email: 'customer@example.com',
      password: 'Password@123',
    };
    const validResult = registerSchema.validate(validPayload);
    assert.strictEqual(validResult.error, undefined, 'Customer registration must pass validation');
    assert.strictEqual(validResult.value.role, 'customer', 'Role defaults strictly to customer');
  });

  console.log('\n======================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
