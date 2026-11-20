const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/testround';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing collections in testround database...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
    ]);

    console.log('Seeding Users...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecommerce.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const customerEmail = process.env.CUSTOMER_EMAIL || 'customer@ecommerce.com';
    const customerPassword = process.env.CUSTOMER_PASSWORD || 'Customer@1234';

    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: '+91 9999988888',
      isActive: true,
    });

    const customerUser = await User.create({
      name: 'Priya Sharma',
      email: customerEmail,
      password: customerPassword,
      role: 'customer',
      phone: '+91 9876543210',
      isActive: true,
      addresses: [
        {
          fullName: 'Priya Sharma',
          phone: '+91 9876543210',
          street: '124 Lotus Boulevard, Sector 100',
          city: 'Noida',
          state: 'Uttar Pradesh',
          zipCode: '201304',
          country: 'India',
          isDefault: true,
        },
      ],
    });

    const inactiveCustomer = await User.create({
      name: 'Suspended User',
      email: 'inactive@ecommerce.com',
      password: 'Customer@1234',
      role: 'customer',
      phone: '+91 9123456780',
      isActive: false, // Testing deactivation
    });

    console.log(`Users seeded: 1 Admin (${adminUser.email}), 2 Customers`);

    console.log('Seeding Multi-Level Category Hierarchy (as per requirement specification)...');
    /*
      Electronics
      ├── Mobiles
      │   ├── Android Phones
      │   │   ├── Samsung
      │   │   └── OnePlus
      │   └── iPhones
      └── Computers
          ├── Laptops
          └── Desktops
    */

    // Level 1: Electronics (Root)
    const catElectronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Consumer gadgets, smartphones, computers, and devices',
      parentId: null,
      ancestors: [],
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
    });

    // Level 2: Mobiles (under Electronics)
    const catMobiles = await Category.create({
      name: 'Mobiles',
      slug: 'mobiles',
      description: 'Smartphones and cellphones from top brands',
      parentId: catElectronics._id,
      ancestors: [catElectronics._id],
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    });

    // Level 2: Computers (under Electronics)
    const catComputers = await Category.create({
      name: 'Computers',
      slug: 'computers',
      description: 'High-performance workstations, laptops, and desktop PCs',
      parentId: catElectronics._id,
      ancestors: [catElectronics._id],
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    });

    // Level 3: Android Phones (under Mobiles)
    const catAndroid = await Category.create({
      name: 'Android Phones',
      slug: 'android-phones',
      description: 'Latest Android devices powered by Qualcomm and MediaTek',
      parentId: catMobiles._id,
      ancestors: [catElectronics._id, catMobiles._id],
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
    });

    // Level 3: iPhones (under Mobiles)
    const catIPhones = await Category.create({
      name: 'iPhones',
      slug: 'iphones',
      description: 'Apple iPhone series with iOS and Bionic silicon',
      parentId: catMobiles._id,
      ancestors: [catElectronics._id, catMobiles._id],
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    });

    // Level 4: Samsung (under Android Phones)
    const catSamsung = await Category.create({
      name: 'Samsung',
      slug: 'samsung',
      description: 'Samsung Galaxy smartphones & foldables',
      parentId: catAndroid._id,
      ancestors: [catElectronics._id, catMobiles._id, catAndroid._id],
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
    });

    // Level 4: OnePlus (under Android Phones)
    const catOnePlus = await Category.create({
      name: 'OnePlus',
      slug: 'oneplus',
      description: 'OnePlus flagship and Nord series with OxygenOS',
      parentId: catAndroid._id,
      ancestors: [catElectronics._id, catMobiles._id, catAndroid._id],
      image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
    });

    // Level 3: Laptops (under Computers)
    const catLaptops = await Category.create({
      name: 'Laptops',
      slug: 'laptops',
      description: 'Ultrabooks, gaming notebooks, and MacBook devices',
      parentId: catComputers._id,
      ancestors: [catElectronics._id, catComputers._id],
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
    });

    // Level 3: Desktops (under Computers)
    const catDesktops = await Category.create({
      name: 'Desktops',
      slug: 'desktops',
      description: 'Custom gaming rigs, all-in-one PCs, and workstations',
      parentId: catComputers._id,
      ancestors: [catElectronics._id, catComputers._id],
      image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&auto=format&fit=crop&q=80',
    });

    console.log('Categories hierarchy seeded successfully!');

    console.log('Seeding Products...');
    const products = await Product.create([
      {
        name: 'Samsung Galaxy S24 Ultra 5G',
        sku: 'SAM-S24U-256-GRY',
        slug: 'samsung-galaxy-s24-ultra-5g',
        description: 'Titanium frame, 200MP AI quad-camera, Snapdragon 8 Gen 3 for Galaxy, and built-in S Pen.',
        price: 129999,
        salePrice: 119999,
        stock: 25,
        category: catSamsung._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
        ],
      },
      {
        name: 'Samsung Galaxy Z Fold 6',
        sku: 'SAM-ZFOLD6-512-SLV',
        slug: 'samsung-galaxy-z-fold-6',
        description: 'Next-gen foldable dynamic AMOLED 2X display, Galaxy AI assistance, water resistance.',
        price: 164999,
        salePrice: 154999,
        stock: 12,
        category: catSamsung._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
        ],
      },
      {
        name: 'OnePlus 12 5G (Flowy Emerald)',
        sku: '1P-12-512-EMR',
        slug: 'oneplus-12-5g-flowy-emerald',
        description: 'Snapdragon 8 Gen 3, 4th Gen Hasselblad camera for mobile, 100W SUPERVOOC charging.',
        price: 69999,
        salePrice: 64999,
        stock: 30,
        category: catOnePlus._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
        ],
      },
      {
        name: 'Apple iPhone 16 Pro Max 256GB',
        sku: 'APL-IP16PM-256-DES',
        slug: 'apple-iphone-16-pro-max-256gb',
        description: 'Desert Titanium design, A18 Pro chip, 48MP Fusion camera system with 4K 120 fps Dolby Vision.',
        price: 144900,
        salePrice: 139900,
        stock: 18,
        category: catIPhones._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
        ],
      },
      {
        name: 'Apple MacBook Pro 16" M3 Max',
        sku: 'APL-MBP16-M3MAX',
        slug: 'apple-macbook-pro-16-m3-max',
        description: 'Liquid Retina XDR display, 36GB unified memory, 1TB SSD, Space Black finish.',
        price: 349900,
        salePrice: 329900,
        stock: 8,
        category: catLaptops._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        ],
      },
      {
        name: 'Dell XPS 15 9530 Touch',
        sku: 'DELL-XPS15-OLED',
        slug: 'dell-xps-15-9530-touch',
        description: '13th Gen Intel Core i9, 3.5K OLED Touchscreen, 32GB DDR5 RAM, NVIDIA RTX 4070.',
        price: 249000,
        salePrice: 229000,
        stock: 14,
        category: catLaptops._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80',
        ],
      },
      {
        name: 'Alienware Aurora R16 Gaming Desktop',
        sku: 'AW-R16-RTX4090',
        slug: 'alienware-aurora-r16-gaming-desktop',
        description: 'Liquid-cooled Intel Core i9-14900KF, 64GB DDR5, 2TB NVMe SSD, GeForce RTX 4090 24GB.',
        price: 389999,
        salePrice: 369999,
        stock: 5,
        category: catDesktops._id,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&auto=format&fit=crop&q=80',
        ],
      },
    ]);

    console.log(`${products.length} products seeded successfully!`);

    console.log('Seeding Sample Orders...');
    const order1 = await Order.create({
      orderNumber: 'ORD-20261120-SAMPLE1',
      customer: customerUser._id,
      items: [
        {
          product: products[0]._id,
          name: products[0].name,
          sku: products[0].sku,
          price: products[0].salePrice || products[0].price,
          quantity: 1,
          subtotal: (products[0].salePrice || products[0].price) * 1,
          image: products[0].images[0],
        },
      ],
      itemsSubtotal: 119999,
      tax: 5999.95,
      shippingFee: 0,
      totalAmount: 125998.95,
      shippingAddress: customerUser.addresses[0],
      status: 'Confirmed',
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(Date.now() - 86400000),
          updatedBy: customerUser._id,
          note: 'Order placed by customer',
        },
        {
          status: 'Confirmed',
          timestamp: new Date(Date.now() - 43200000),
          updatedBy: adminUser._id,
          note: 'Stock allocated and verified',
        },
      ],
    });

    console.log('Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Default Credentials:');
    console.log('Admin:    admin@ecommerce.com    / Admin@1234');
    console.log('Customer: customer@ecommerce.com / Customer@1234');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
