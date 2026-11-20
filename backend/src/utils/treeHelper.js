const Category = require('../models/Category');

/**
 * Builds a nested hierarchical tree from a flat list of category documents.
 * @param {Array} categories - Array of category documents or plain objects
 * @param {ObjectId|String|null} parentId - Current parentId to branch from
 * @returns {Array} Nested tree array with children properties
 */
const buildCategoryTree = (categories, parentId = null) => {
  const tree = [];
  const parentKey = parentId ? parentId.toString() : null;

  for (const cat of categories) {
    const catParentKey = cat.parentId ? cat.parentId.toString() : null;
    if (catParentKey === parentKey) {
      const catObj = cat.toObject ? cat.toObject() : { ...cat };
      const children = buildCategoryTree(categories, cat._id);
      catObj.children = children;
      tree.push(catObj);
    }
  }

  return tree;
};

/**
 * Retrieves all descendant category IDs (including the target category itself)
 * using the ancestors field or recursive DB query.
 * @param {ObjectId|String} categoryId
 * @returns {Promise<Array<ObjectId>>}
 */
const getDescendantCategoryIds = async (categoryId) => {
  if (!categoryId) return [];

  // Since we store ancestors array in Category model:
  // Descendants are categories that have categoryId in their ancestors array.
  const descendants = await Category.find(
    {
      $or: [
        { _id: categoryId },
        { ancestors: categoryId },
      ],
      isActive: true,
    },
    { _id: 1 }
  ).lean();

  return descendants.map((doc) => doc._id);
};

/**
 * Validates whether setting targetParentId as parent of categoryId would cause a circular reference.
 * Returns true if a circular dependency is detected.
 * @param {ObjectId|String} categoryId - The category being updated
 * @param {ObjectId|String} targetParentId - The intended new parent
 * @returns {Promise<boolean>}
 */
const checkCircularDependency = async (categoryId, targetParentId) => {
  if (!targetParentId || !categoryId) return false;

  const catStr = categoryId.toString();
  const parentStr = targetParentId.toString();

  // A category cannot be its own parent
  if (catStr === parentStr) {
    return true;
  }

  // Check if targetParentId has categoryId as one of its ancestors
  // If targetParent has categoryId in its ancestors, making targetParent the parent of categoryId
  // would create a cycle: categoryId -> ... -> targetParent -> categoryId
  const targetParent = await Category.findById(targetParentId).select('ancestors parentId').lean();
  if (!targetParent) return false;

  if (targetParent.ancestors && targetParent.ancestors.some((ancId) => ancId.toString() === catStr)) {
    return true;
  }

  // Double-check via parentId chain traversal for maximum safety
  let currentParentId = targetParent.parentId;
  while (currentParentId) {
    if (currentParentId.toString() === catStr) {
      return true;
    }
    const ancestor = await Category.findById(currentParentId).select('parentId').lean();
    if (!ancestor) break;
    currentParentId = ancestor.parentId;
  }

  return false;
};

module.exports = {
  buildCategoryTree,
  getDescendantCategoryIds,
  checkCircularDependency,
};
