import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Layers,
  ChevronRight,
  ShoppingCart,
  Check,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // Filters from query params
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 12,
  });

  const { addToCart } = useCart();
  const { isAdmin } = useAuth();

  // Load Categories
  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCategory) params.append('category', currentCategory);
      if (currentSearch) params.append('search', currentSearch);
      if (currentSort) params.append('sort', currentSort);
      if (currentMinPrice) params.append('minPrice', currentMinPrice);
      if (currentMaxPrice) params.append('maxPrice', currentMaxPrice);
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentCategory,
    currentSearch,
    currentSort,
    currentPage,
    currentMinPrice,
    currentMaxPrice,
  ]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPriceInput) newParams.set('minPrice', minPriceInput);
    else newParams.delete('minPrice');
    if (maxPriceInput) newParams.set('maxPrice', maxPriceInput);
    else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const handleAddToCart = async (product) => {
    setAddingId(product._id);
    await addToCart(product._id, 1);
    setTimeout(() => setAddingId(null), 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore All Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Discover verified items across our catalog with instant delivery and secure checkout.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sort:
          </span>
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-blue-500"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => updateParam('category', '')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            !currentCategory
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const isSelected = currentCategory === cat.slug || currentCategory === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => updateParam('category', cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search & Price Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by product name, SKU, or specs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-16 py-2 text-xs focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <form onSubmit={handlePriceApply} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="number"
            placeholder="Min ₹"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="w-24 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
          />
          <span className="text-slate-400 text-xs">—</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="w-24 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Filter
          </button>
          {(currentCategory || currentSearch || currentMinPrice || currentMaxPrice) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-red-600 font-bold hover:underline px-1"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading products catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-800">No products found matching your filters.</p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const hasDiscount =
              product.salePrice !== null &&
              product.salePrice !== undefined &&
              product.salePrice < product.price;

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col group cursor-pointer"
              >
                {/* Product Image */}
                <Link
                  to={`/product/${product._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center block"
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
                    <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      SALE
                    </span>
                  )}
                  <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                    {product.sku}
                  </span>
                </Link>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-blue-600 truncate block"
                      title={product.category?.path || product.category?.name}
                    >
                      {product.category?.path || product.category?.name || 'Category'}
                    </span>
                    <Link
                      to={`/product/${product._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block font-bold text-slate-900 hover:text-blue-600 text-sm mt-1 line-clamp-1 transition-colors"
                      title={product.name}
                    >
                      {product.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-slate-900">
                            ₹{product.salePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{product.price.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold block ${
                          product.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/product/${product._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                        title="View product details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {isAdmin ? (
                        <Link
                          to="/admin/products"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
                        >
                          Manage
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.stock <= 0 || addingId === product._id}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        >
                          {addingId === product._id ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" /> Add
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3">
          <button
            onClick={() => updateParam('page', (currentPage - 1).toString())}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            &larr; Prev
          </button>
          <span className="text-xs text-slate-500 px-2 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => updateParam('page', (currentPage + 1).toString())}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
