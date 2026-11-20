const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getDescendantCategoryIds } = require('../utils/treeHelper');
const { deleteFromCloudinary } = require('../config/cloudinary');

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// POST /api/products (Admin only)
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    salePrice,
    stock,
    category,
    status,
    images,
  } = req.body;

  // Verify SKU uniqueness
  const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
  if (existingSku) {
    throw ApiError.conflict(`Product with SKU '${sku}' already exists`);
  }

  // Verify category exists
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    throw ApiError.badRequest('Assigned category does not exist');
  }

  // Generate unique slug
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let count = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  const product = await Product.create({
    name: name.trim(),
    sku: sku.toUpperCase().trim(),
    slug,
    description: description.trim(),
    price: Number(price),
    salePrice: salePrice !== undefined && salePrice !== null && salePrice !== '' ? Number(salePrice) : null,
    stock: parseInt(stock, 10),
    category: categoryDoc._id,
    status: status || 'active',
    images: images || [],
  });

  const populated = await Product.findById(product._id).populate({
    path: 'category',
    select: 'name slug parentId ancestors',
    populate: { path: 'ancestors', select: 'name slug' },
  });

  return ApiResponse.created(res, populated, 'Product created successfully');
});

// GET /api/products (Public / Customer listing with multi-level category filtering)
const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
    status,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  // Admin may request 'all' or specific status; public users only get 'active'
  if (req.user && req.user.role === 'admin' && status) {
    if (status !== 'all') {
      query.status = status;
    }
  } else {
    query.status = 'active';
  }

  // 1. Text Search across name, SKU, and description
  if (search && search.trim() !== '') {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    query.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { description: searchRegex },
    ];
  }

  // 2. Multi-Level Category Filtering
  // KEY REQUIREMENT: "When filtering by a parent category, products belonging to all its child/subcategories should also be returned."
  if (category && category.trim() !== '') {
    let targetCategory = null;
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      targetCategory = await Category.findById(category);
    } else {
      targetCategory = await Category.findOne({ slug: category.toLowerCase().trim() });
    }

    if (targetCategory) {
      // Find all category IDs including target and ALL its descendants at any depth
      const categoryIds = await getDescendantCategoryIds(targetCategory._id);
      query.category = { $in: categoryIds };
    } else {
      // Specified category doesn't exist, return empty result
      return ApiResponse.success(res, [], 'Products fetched successfully', 200, {
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }
  }

  // 3. Price Range Filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.$and = query.$and || [];
    const min = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : 0;
    const max = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : Infinity;

    const salePriceFilter = { $ne: null, $gte: min };
    const regularPriceFilter = { $gte: min };
    if (max !== Infinity) {
      salePriceFilter.$lte = max;
      regularPriceFilter.$lte = max;
    }

    // Condition matches if effective price is between min and max
    query.$and.push({
      $or: [
        { salePrice: salePriceFilter },
        {
          $or: [{ salePrice: null }, { salePrice: { $exists: false } }],
          price: regularPriceFilter,
        },
      ],
    });
  }

  // 4. Sorting
  const sortOptions = {};
  switch (sort) {
    case 'price_asc':
      sortOptions.price = 1;
      break;
    case 'price_desc':
      sortOptions.price = -1;
      break;
    case 'name_asc':
      sortOptions.name = 1;
      break;
    case 'name_desc':
      sortOptions.name = -1;
      break;
    case 'oldest':
      sortOptions.createdAt = 1;
      break;
    case 'newest':
    default:
      sortOptions.createdAt = -1;
      break;
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .populate({
        path: 'category',
        select: 'name slug parentId ancestors',
        populate: { path: 'ancestors', select: 'name slug' },
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const formattedProducts = products.map((prod) => {
    if (prod.category) {
      const ancNames = (prod.category.ancestors || []).map((a) => a.name).filter(Boolean);
      prod.category.path = ancNames.length > 0
        ? `${ancNames.join(' → ')} → ${prod.category.name}`
        : prod.category.name;
    }
    return prod;
  });

  const totalPages = Math.ceil(total / limitNum) || 1;

  return ApiResponse.success(res, formattedProducts, 'Products fetched successfully', 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
});

// GET /api/products/:idOrSlug (Public)
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cleanId = (id || '').trim();
  let product = null;

  if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(cleanId).populate({
      path: 'category',
      populate: { path: 'ancestors', select: 'name slug' },
    });
  } else {
    product = await Product.findOne({ slug: cleanId.toLowerCase() }).populate({
      path: 'category',
      populate: { path: 'ancestors', select: 'name slug' },
    });
  }

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return ApiResponse.success(res, product, 'Product details fetched successfully');
});

// PUT /api/products/:id (Admin only)
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    salePrice,
    stock,
    category,
    status,
    images,
  } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (sku && sku.toUpperCase().trim() !== product.sku) {
    const existingSku = await Product.findOne({
      _id: { $ne: product._id },
      sku: sku.toUpperCase().trim(),
    });
    if (existingSku) {
      throw ApiError.conflict(`Product with SKU '${sku}' already exists`);
    }
    product.sku = sku.toUpperCase().trim();
  }

  if (category) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      throw ApiError.badRequest('Assigned category does not exist');
    }
    product.category = categoryDoc._id;
  }

  if (name && name.trim() !== product.name) {
    product.name = name.trim();
    product.slug = generateSlug(name);
  }

  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (salePrice !== undefined) {
    product.salePrice = salePrice !== null && salePrice !== '' ? Number(salePrice) : null;
  }
  if (stock !== undefined) product.stock = parseInt(stock, 10);
  if (status !== undefined) product.status = status;
  if (images !== undefined) {
    // Clean up any old Cloudinary images that were removed in the update
    const oldImages = product.images || [];
    const removedImages = oldImages.filter((oldImg) => !images.includes(oldImg));
    for (const oldImg of removedImages) {
      await deleteFromCloudinary(oldImg);
    }
    product.images = images;
  }

  await product.save();

  const updated = await Product.findById(product._id).populate({
    path: 'category',
    select: 'name slug parentId ancestors',
    populate: { path: 'ancestors', select: 'name slug' },
  });
  return ApiResponse.success(res, updated, 'Product updated successfully');
});

// DELETE /api/products/:id (Admin only)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Delete all product images from Cloudinary upon deletion
  if (product.images && product.images.length > 0) {
    for (const imgUrl of product.images) {
      await deleteFromCloudinary(imgUrl);
    }
  }

  await Product.findByIdAndDelete(req.params.id);
  return ApiResponse.success(res, null, 'Product deleted successfully');
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
