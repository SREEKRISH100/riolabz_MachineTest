const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    // Array of ancestor ObjectIds (ordered from root down to direct parent)
    // Enables O(1) ancestor lookups and blazingly fast subtree querying
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ name: 1, parentId: 1 }, { unique: true });
categorySchema.index({ ancestors: 1 });
categorySchema.index({ parentId: 1, isActive: 1 });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
module.exports = Category;
