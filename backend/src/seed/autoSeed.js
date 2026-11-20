const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * Automatically ensures that the default Admin, Customer, and Category Hierarchy
 * exist on server startup so the application works out-of-the-box without manual seeding.
 */
const autoSeed = async () => {
  try {
    // 1. Ensure Default Admin User exists
    let admin = await User.findOne({ email: 'admin@ecommerce.com' });
    if (!admin) {
      console.log('⚡ Initializing default Admin account (admin@ecommerce.com)...');
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@ecommerce.com',
        password: 'Admin@1234',
        role: 'admin',
        phone: '+91 9999988888',
        isActive: true,
      });
      console.log('✅ Default Admin account created successfully!');
    } else {
      // If admin exists, ensure active and role is admin
      if (!admin.isActive || admin.role !== 'admin') {
        admin.isActive = true;
        admin.role = 'admin';
        await admin.save();
      }
    }

    // 2. Ensure Default Customer User exists
    let customer = await User.findOne({ email: 'customer@ecommerce.com' });
    if (!customer) {
      console.log('⚡ Initializing default Customer account (customer@ecommerce.com)...');
      customer = await User.create({
        name: 'Priya Sharma',
        email: 'customer@ecommerce.com',
        password: 'Customer@1234',
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
      console.log('✅ Default Customer account created successfully!');
    }

    // 3. Ensure Category Hierarchy exists
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('⚡ Initializing Multi-Level Category Hierarchy...');

      // Root: Electronics
      const catElectronics = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Consumer gadgets, smartphones, computers, and devices',
        parentId: null,
        ancestors: [],
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
      });

      // Level 2: Mobiles
      const catMobiles = await Category.create({
        name: 'Mobiles',
        slug: 'mobiles',
        description: 'Smartphones and cellphones from top brands',
        parentId: catElectronics._id,
        ancestors: [catElectronics._id],
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
      });

      // Level 2: Computers
      const catComputers = await Category.create({
        name: 'Computers',
        slug: 'computers',
        description: 'High-performance workstations, laptops, and desktop PCs',
        parentId: catElectronics._id,
        ancestors: [catElectronics._id],
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
      });

      // Level 3: Android Phones
      const catAndroid = await Category.create({
        name: 'Android Phones',
        slug: 'android-phones',
        description: 'Latest Android devices powered by Qualcomm and MediaTek',
        parentId: catMobiles._id,
        ancestors: [catElectronics._id, catMobiles._id],
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
      });

      // Level 3: iPhones
      const catIPhones = await Category.create({
        name: 'iPhones',
        slug: 'iphones',
        description: 'Apple iPhone series with iOS and Bionic silicon',
        parentId: catMobiles._id,
        ancestors: [catElectronics._id, catMobiles._id],
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
      });

      // Level 4: Samsung
      const catSamsung = await Category.create({
        name: 'Samsung',
        slug: 'samsung',
        description: 'Samsung Galaxy smartphones & foldables',
        parentId: catAndroid._id,
        ancestors: [catElectronics._id, catMobiles._id, catAndroid._id],
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
      });

      // Level 4: OnePlus
      const catOnePlus = await Category.create({
        name: 'OnePlus',
        slug: 'oneplus',
        description: 'OnePlus flagship and Nord series with OxygenOS',
        parentId: catAndroid._id,
        ancestors: [catElectronics._id, catMobiles._id, catAndroid._id],
        image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
      });

      // Level 3: Laptops
      const catLaptops = await Category.create({
        name: 'Laptops',
        slug: 'laptops',
        description: 'Ultrabooks, gaming notebooks, and MacBook devices',
        parentId: catComputers._id,
        ancestors: [catElectronics._id, catComputers._id],
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
      });

      // Level 3: Desktops
      const catDesktops = await Category.create({
        name: 'Desktops',
        slug: 'desktops',
        description: 'Custom gaming rigs, all-in-one PCs, and workstations',
        parentId: catComputers._id,
        ancestors: [catElectronics._id, catComputers._id],
        image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&auto=format&fit=crop&q=80',
      });

      // Root 2: Clothing & Apparel
      const catClothing = await Category.create({
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion apparel, streetwear, formal and casual wear',
        parentId: null,
        ancestors: [],
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
      });

      // Level 2: Men
      const catMen = await Category.create({
        name: 'Men',
        slug: 'clothing-men',
        description: 'Menswear collection',
        parentId: catClothing._id,
        ancestors: [catClothing._id],
      });

      // Level 2: Women
      const catWomen = await Category.create({
        name: 'Women',
        slug: 'clothing-women',
        description: 'Womenswear collection',
        parentId: catClothing._id,
        ancestors: [catClothing._id],
      });

      // Level 3: T-Shirts under Men
      const catMenTShirts = await Category.create({
        name: 'T-Shirts',
        slug: 'men-t-shirts',
        description: 'Graphic, polo, and crew neck t-shirts for men',
        parentId: catMen._id,
        ancestors: [catClothing._id, catMen._id],
      });

      // Level 3: T-Shirts under Women (Same name 'T-Shirts', different parent!)
      const catWomenTShirts = await Category.create({
        name: 'T-Shirts',
        slug: 'women-t-shirts',
        description: 'Cropped, oversized, and essential t-shirts for women',
        parentId: catWomen._id,
        ancestors: [catClothing._id, catWomen._id],
      });

      // 4. Ensure Products exist
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log('⚡ Initializing Sample Products...');
        await Product.create([
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
        ]);
        console.log('✅ Default Products seeded successfully!');
      }
    }
  } catch (error) {
    console.error('AutoSeed Warning:', error.message);
  }
};

module.exports = autoSeed;
