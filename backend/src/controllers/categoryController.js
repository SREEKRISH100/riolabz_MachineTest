const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { deleteFromCloudinary } = require('../config/cloudinary');
const {
  buildCategoryTree,
  checkCircularDependency,
} = require('../utils/treeHelper');

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// POST /api/categories (Admin only)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentId, image, isActive } = req.body;

  const targetParentId = parentId || null;

  // Sibling uniqueness check: Name must be unique within the same parent
  // Allows e.g. "Cloths > Mens > T-shirt" and "Cloths > Womens > T-shirt"
  const existingName = await Category.findOne({
    parentId: targetParentId,
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
  });
  if (existingName) {
    throw ApiError.conflict(
      `A category with name '${name}' already exists under this parent category`
    );
  }

  let ancestors = [];
  let parentDoc = null;

  if (targetParentId) {
    parentDoc = await Category.findById(targetParentId);
    if (!parentDoc) {
      throw ApiError.badRequest('Specified parent category does not exist');
    }
    // Ancestors = parent's ancestors + parent._id
    ancestors = [...parentDoc.ancestors, parentDoc._id];
  }

  // Generate unique slug, prefixing parent's slug for clarity and SEO
  let baseSlug = parentDoc ? `${parentDoc.slug}-${generateSlug(name)}` : generateSlug(name);
  let slug = baseSlug;
  let count = 1;
  while (await Category.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  const category = await Category.create({
    name: name.trim(),
    slug,
    description: description || '',
    parentId: targetParentId,
    ancestors,
    image: image || '',
    isActive: isActive !== undefined ? isActive : true,
  });

  const populated = await Category.findById(category._id)
    .populate('parentId', 'name slug')
    .populate('ancestors', 'name slug');

  return ApiResponse.created(res, populated, 'Category created successfully');
});

// GET /api/categories (Public) - with optional ?tree=true
const getCategories = asyncHandler(async (req, res) => {
  const { tree, includeInactive } = req.query;

  const query = {};
  if (includeInactive !== 'true') {
    query.isActive = true;
  }

  const categories = await Category.find(query)
    .populate('parentId', 'name slug')
    .populate('ancestors', 'name slug')
    .sort({ name: 1 })
    .lean();

  if (tree === 'true') {
    const categoryTree = buildCategoryTree(categories, null);
    return ApiResponse.success(res, categoryTree, 'Category tree fetched successfully');
  }

  // Enrich flat list with full breadcrumb path & hierarchy level
  const formatted = categories.map((cat) => {
    const ancestorNames = (cat.ancestors || []).map((a) => a.name).filter(Boolean);
    const path = ancestorNames.length > 0 ? `${ancestorNames.join(' → ')} → ${cat.name}` : cat.name;
    return {
      ...cat,
      path,
      level: ancestorNames.length,
    };
  });

  // Sort hierarchically by full path
  formatted.sort((a, b) => a.path.localeCompare(b.path));

  return ApiResponse.success(res, formatted, 'Categories fetched successfully');
});

// GET /api/categories/tree (Public) - Dedicated tree hierarchy endpoint
const getCategoryTree = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;

  const query = {};
  if (includeInactive !== 'true') {
    query.isActive = true;
  }

  const categories = await Category.find(query).sort({ name: 1 }).lean();
  const tree = buildCategoryTree(categories, null);

  return ApiResponse.success(res, tree, 'Complete category hierarchy fetched successfully');
});

// GET /api/categories/:id (Public)
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parentId', 'name slug')
    .populate('ancestors', 'name slug');

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Also fetch direct subcategories
  const directChildren = await Category.find({ parentId: category._id, isActive: true })
    .select('name slug image description')
    .lean();

  const data = category.toObject();
  data.directChildren = directChildren;

  return ApiResponse.success(res, data, 'Category fetched successfully');
});

// PUT /api/categories/:id (Admin only)
const updateCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const { name, description, parentId, image, isActive } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  const newParentId = parentId !== undefined ? (parentId ? parentId.toString() : null) : undefined;
  const oldParentId = category.parentId ? category.parentId.toString() : null;
  const targetParentId = newParentId !== undefined ? newParentId : oldParentId;

  // If name or parent is updated, ensure sibling uniqueness under the target parent
  if (name && (name.trim().toLowerCase() !== category.name.toLowerCase() || (newParentId !== undefined && newParentId !== oldParentId))) {
    const existing = await Category.findOne({
      _id: { $ne: categoryId },
      parentId: targetParentId || null,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      throw ApiError.conflict(
        `A category with name '${name}' already exists under this parent category`
      );
    }
    category.name = name.trim();
    category.slug = generateSlug(name);
  }

  if (description !== undefined) category.description = description;
  if (image !== undefined && image !== category.image) {
    // If previous image exists on Cloudinary, delete it before setting new image
    if (category.image) {
      await deleteFromCloudinary(category.image);
    }
    category.image = image;
  }
  if (isActive !== undefined) category.isActive = isActive;

  // Handle parentId changes & circular dependency check
  if (newParentId !== undefined && newParentId !== oldParentId) {
    if (newParentId) {
      // 1. Cannot be its own parent
      if (newParentId === categoryId.toString()) {
        throw ApiError.badRequest('A category cannot be its own parent');
      }

      // 2. Parent must exist
      const newParent = await Category.findById(newParentId);
      if (!newParent) {
        throw ApiError.badRequest('Specified parent category does not exist');
      }

      // 3. Circular dependency check: Cannot set a descendant as parent!
      const isCircular = await checkCircularDependency(categoryId, newParentId);
      if (isCircular) {
        throw ApiError.badRequest(
          'Circular dependency detected: Category cannot have one of its descendants as its parent'
        );
      }

      // Compute new ancestors
      const oldAncestors = category.ancestors.map((id) => id.toString());
      const newAncestors = [...newParent.ancestors, newParent._id];

      category.parentId = newParent._id;
      category.ancestors = newAncestors;

      // Update all descendants' ancestors array
      const descendants = await Category.find({ ancestors: categoryId });
      for (const desc of descendants) {
        const descAncestorsStr = desc.ancestors.map((id) => id.toString());
        // Find index of categoryId in descendant's ancestors
        const catIndex = descAncestorsStr.indexOf(categoryId.toString());
        if (catIndex !== -1) {
          const suffix = desc.ancestors.slice(catIndex + 1);
          desc.ancestors = [...newAncestors, category._id, ...suffix];
          await desc.save();
        }
      }
    } else {
      // Setting to root category (no parent)
      category.parentId = null;
      category.ancestors = [];

      // Update descendants
      const descendants = await Category.find({ ancestors: categoryId });
      for (const desc of descendants) {
        const descAncestorsStr = desc.ancestors.map((id) => id.toString());
        const catIndex = descAncestorsStr.indexOf(categoryId.toString());
        if (catIndex !== -1) {
          const suffix = desc.ancestors.slice(catIndex + 1);
          desc.ancestors = [category._id, ...suffix];
          await desc.save();
        }
      }
    }
  }

  await category.save();

  return ApiResponse.success(res, category, 'Category updated successfully');
});

// DELETE /api/categories/:id (Admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Check if category has child categories
  const hasChildren = await Category.exists({ parentId: categoryId });
  if (hasChildren) {
    throw ApiError.badRequest(
      'Cannot delete category because it has subcategories. Please reassign or delete the subcategories first.'
    );
  }

  // Check if products exist in this category
  const hasProducts = await Product.exists({ category: categoryId });
  if (hasProducts) {
    throw ApiError.badRequest(
      'Cannot delete category because active products are assigned to it. Please reassign or remove the products first.'
    );
  }

  // Delete category image from Cloudinary if present
  if (category.image) {
    await deleteFromCloudinary(category.image);
  }

  await Category.findByIdAndDelete(categoryId);

  return ApiResponse.success(res, null, 'Category deleted successfully');
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryTree,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
