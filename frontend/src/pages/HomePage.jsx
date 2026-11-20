import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Sparkles,
  Smartphone,
  Laptop,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    // If signed in as admin, redirect directly to admin dashboard
    if (isAdmin || user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, user, navigate]);

  useEffect(() => {
    Promise.all([
      api.get('/categories/tree'),
      api.get('/products?limit=6&sort=newest'),
    ])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data.data || []);
        setFeaturedProducts(prodRes.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product) => {
    setAddingId(product._id);
    await addToCart(product._id, 1);
    setTimeout(() => setAddingId(null), 500);
  };

  return (
    <div className="space-y-10 pb-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8 rounded-b-[32px] shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Discover Handpicked Deals & Top Trending Products
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-4xl text-slate-100 leading-tight">
            Premium E-Commerce Shopping{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Direct to Your Doorstep
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
            Shop the latest electronics, stylish apparel, and everyday essentials with lightning-fast delivery, secure payment, and easy returns.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Explore All Products
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#categories"
              className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              Browse Categories
            </a>
          </div>

          {/* Quick Value Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl mt-8 pt-6 border-t border-slate-800 text-left">
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
                Fast Delivery
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white">Free Over ₹1,000</p>
              <p className="text-[11px] text-slate-400">Quick doorstep dispatch</p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
                Genuine Brand
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white">100% Authentic</p>
              <p className="text-[11px] text-slate-400">Verified manufacturer stock</p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
                Easy Returns
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white">7-Day Guarantee</p>
              <p className="text-[11px] text-slate-400">Hassle-free replacement</p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-purple-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
                Safe Payment
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white">Cards, UPI & COD</p>
              <p className="text-[11px] text-slate-400">Bank-grade encryption</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tree Visualizer Section */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-blue-600 block">
              Curated Collections
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((root) => (
            <div
              key={root._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{root.name}</h3>
                      <p className="text-xs text-slate-500">Root Category</p>
                    </div>
                  </div>
                  <Link
                    to={`/products?category=${root.slug}`}
                    className="p-2 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-all"
                    title={`View all products in ${root.name} and subcategories`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{root.description}</p>

                {/* Subcategories preview */}
                {root.children && root.children.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Subcategories ({root.children.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {root.children.map((sub) => (
                        <Link
                          key={sub._id}
                          to={`/products?category=${sub.slug}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Includes all sub-descendants</span>
                <Link
                  to={`/products?category=${root.slug}`}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Filter Products &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-blue-600 block">
              Curated Inventory
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Trending Products
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View Entire Catalog <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredProducts.map((product) => {
            const hasDiscount =
              product.salePrice !== null &&
              product.salePrice !== undefined &&
              product.salePrice < product.price;

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col group cursor-pointer"
              >
                {/* Image */}
                <Link
                  to={`/product/${product._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="relative h-56 bg-slate-100 overflow-hidden flex items-center justify-center block"
                >
                  <img
                    src={
                      product.images?.[0] ||
                      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600';
                    }}
                  />
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      SAVE ₹{(product.price - product.salePrice).toLocaleString()}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    {product.sku}
                  </span>
                </Link>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      {product.category?.name || 'Category'}
                    </span>
                    <Link
                      to={`/product/${product._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block font-bold text-slate-900 hover:text-blue-600 text-base mt-1 line-clamp-1 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-slate-900">
                            ₹{product.salePrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.price.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-slate-900">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/product/${product._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock <= 0 || addingId === product._id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {addingId === product._id ? 'Added!' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
