import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  Shield,
  Truck,
  RotateCcw,
  ChevronRight,
  Minus,
  Plus,
  Check,
  ArrowLeft,
  AlertCircle,
  Package,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    setSelectedImage(0);
    setQuantity(1);

    api
      .get(`/products/${id}`)
      .then((res) => {
        if (res.data && res.data.data) {
          setProduct(res.data.data);
        } else {
          setErrorMsg('Product could not be loaded');
        }
      })
      .catch((err) => {
        console.error('Error fetching product details:', err);
        setErrorMsg(err.response?.data?.message || 'Product could not be loaded');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {errorMsg || "The product you're looking for does not exist or has been removed."}
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  const regularPrice = typeof product.price === 'number' ? product.price : 0;
  const salePrice = typeof product.salePrice === 'number' ? product.salePrice : null;
  const hasDiscount = salePrice !== null && salePrice < regularPrice;
  const currentPrice = hasDiscount ? salePrice : regularPrice;
  const discountPercent =
    regularPrice > 0 && hasDiscount
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;
  const stock = typeof product.stock === 'number' ? product.stock : 0;

  // Filter valid image URLs
  const rawImages = Array.isArray(product.images)
    ? product.images.filter((img) => img && typeof img === 'string' && img.trim() !== '')
    : [];
  const displayImages = rawImages.length > 0 ? rawImages : [FALLBACK_IMAGE];
  const activeImage = displayImages[selectedImage] || displayImages[0];

  const handleAddToCart = async () => {
    const result = await addToCart(product._id, quantity);
    if (result.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } else {
      alert(result.message);
    }
  };

  const handleBuyNow = async () => {
    const result = await addToCart(product._id, quantity);
    if (result.success) {
      navigate('/cart');
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* Category Breadcrumbs with Ancestors */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/products" className="hover:text-blue-600 transition-colors">
            Products
          </Link>

          {product.category?.ancestors &&
            Array.isArray(product.category.ancestors) &&
            product.category.ancestors
              .filter((anc) => anc && typeof anc === 'object' && anc.name)
              .map((anc) => (
                <React.Fragment key={anc._id || anc.slug || anc.name}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <Link
                    to={`/products?category=${anc.slug || ''}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {anc.name}
                  </Link>
                </React.Fragment>
              ))}

          {product.category && typeof product.category === 'object' && product.category.name && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                to={`/products?category=${product.category.slug || ''}`}
                className="text-blue-600 font-semibold"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Main product showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        {/* Images */}
        <div className="space-y-4">
          <div className="h-96 sm:h-[450px] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src={activeImage}
              alt={product.name || 'Product'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Purchase Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {product.category?.name && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                  {product.category.name}
                </span>
              )}
              {product.sku && (
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-slate-900">
                ₹{currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{regularPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock status */}
            <div>
              {stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  In Stock ({stock} units available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200/60">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Out of Stock
                </span>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Description & Specifications
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Actions & Purchasing */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            {isAdmin ? (
              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-indigo-900">Administrator Preview</p>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Admins manage catalog inventory and do not buy products. Customers can purchase this item.
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/products"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                >
                  Manage in Admin Console &rarr;
                </Link>
              </div>
            ) : (
              <>
                {stock > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 text-xs font-bold text-slate-800">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                        disabled={quantity >= stock}
                        className="p-2 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={handleAddToCart}
                    disabled={stock <= 0}
                    className="flex-1 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={stock <= 0}
                    className="py-3 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400" /> Buy Now
                  </button>
                </div>
              </>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <Truck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Fast Dispatch
                </span>
                <span className="text-[10px] text-slate-400">Direct doorstep delivery</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Authentic Stock
                </span>
                <span className="text-[10px] text-slate-400">100% Guaranteed</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <RotateCcw className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">
                  7-Day Return
                </span>
                <span className="text-[10px] text-slate-400">Hassle-free policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
