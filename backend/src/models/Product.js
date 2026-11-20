const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product regular price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price must be greater than or equal to 0'],
      default: null,
      validate: {
        validator: function (val) {
          if (val === null || val === undefined) return true;
          return val <= this.price;
        },
        message: 'Sale price ({VALUE}) cannot exceed regular price',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer stock value',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid product status',
      },
      default: 'active',
      index: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant searching, filtering, and sorting
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ createdAt: -1 });

// Helper virtual to get effective current price
productSchema.virtual('effectivePrice').get(function () {
  return this.salePrice !== null && this.salePrice !== undefined && this.salePrice < this.price
    ? this.salePrice
    : this.price;
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
