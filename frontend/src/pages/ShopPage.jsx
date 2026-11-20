import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingCart,
  Check,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// Recursive category tree item component
const CategoryTreeNode = ({ node, activeCategory, onSelectCategory }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = activeCategory === node.slug || activeCategory === node._id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="pl-2">
      <div
        className={`flex items-center justify-between py-1.5 px-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white font-bold'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div
          className="flex-1 flex items-center gap-1.5 truncate"
          onClick={() => onSelectCategory(node.slug)}
        >
          <span className="truncate">{node.name}</span>
        </div>

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className={`p-1 rounded-md transition-colors ${
              isSelected ? 'hover:bg-blue-700 text-white' : 'hover:bg-slate-200 text-slate-400'
            }`}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-2 pl-2 border-l border-slate-200 space-y-0.5 mt-0.5">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              node={child}
              activeCategory={activeCategory}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters from query params
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [addingId, setAddingId] = useState(null);

  const { addToCart } = useCart();
  const { isAdmin } = useAuth();

  // Load category tree
  useEffect(() => {
    api
      .get('/categories/tree')
      .then((res) => setCategoryTree(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCategory) params.append('category', currentCategory);
      if (currentSearch) params.append('search', currentSearch);
      if (currentSort) params.append('sort', currentSort);
      if (currentPage) params.append('page', currentPage.toString());
      if (currentMinPrice) params.append('minPrice', currentMinPrice);
      if (currentMaxPrice) params.append('maxPrice', currentMaxPrice);
      params.append('limit', '12');

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentSearch, currentSort, currentPage, currentMinPrice, currentMaxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Title & Active Filter Bar */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Product Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Showing {pagination.total} products in store
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sort By:
            </span>
            <div className="relative">
              <select
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Badges */}
        {(currentCategory || currentSearch || currentMinPrice || currentMaxPrice) && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-400 font-semibold">Active Filters:</span>

            {currentCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200/60">
                Category: {currentCategory}
                <button onClick={() => updateParam('category', '')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentSearch && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200/60">
                Search: "{currentSearch}"
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateParam('search', '');
                  }}
                  className="hover:text-indigo-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(currentMinPrice || currentMaxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60">
                Price: ₹{currentMinPrice || '0'} - ₹{currentMaxPrice || '∞'}
                <button
                  onClick={() => {
                    setMinPriceInput('');
                    setMaxPriceInput('');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('minPrice');
                    newParams.delete('maxPrice');
                    setSearchParams(newParams);
                  }}
                  className="hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 font-bold hover:underline ml-2"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          {/* Search box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" /> Search
            </h3>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Product, SKU, specs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-blue-600 font-bold text-xs hover:underline"
              >
                Go
              </button>
            </form>
          </div>

          {/* Multi-Level Category Tree */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Category Tree
              </h3>
              {currentCategory && (
                <button
                  onClick={() => updateParam('category', '')}
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Selecting a parent category returns products from all its subcategories!
            </p>

            <div className="space-y-1">
              <div
                onClick={() => updateParam('category', '')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  !currentCategory
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Categories
              </div>

              {categoryTree.map((rootNode) => (
                <CategoryTreeNode
                  key={rootNode._id}
                  node={rootNode}
                  activeCategory={currentCategory}
                  onSelectCategory={(slug) => updateParam('category', slug)}
                />
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" /> Price Filter (₹)
            </h3>
            <form onSubmit={handlePriceApply} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Min
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Max
                  </label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Apply Range
              </button>
            </form>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl h-80 border border-slate-200 animate-pulse p-4 flex flex-col justify-between"
                >
                  <div className="bg-slate-200 h-44 rounded-2xl w-full"></div>
                  <div className="space-y-2">
                    <div className="bg-slate-200 h-4 rounded w-3/4"></div>
                    <div className="bg-slate-200 h-3 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No products found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No products match the selected category or filters. Try adjusting your search or clearing active filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
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
                      className="relative h-52 bg-slate-100 overflow-hidden flex items-center justify-center block"
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
                          SALE
                        </span>
                      )}
                      <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                        {product.sku}
                      </span>
                    </Link>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider text-blue-600 truncate block"
                          title={product.category?.path || product.category?.name}
                        >
                          {product.category?.path || product.category?.name || 'Category'}
                        </span>
                        <Link
                          to={`/product/${product._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block font-bold text-slate-900 hover:text-blue-600 text-sm mt-1 line-clamp-1 transition-colors"
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
                              <span className="text-base font-extrabold text-slate-900">
                                ₹{product.salePrice.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                ₹{product.price.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-extrabold text-slate-900">
                              ₹{product.price.toLocaleString()}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-semibold block ${
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
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {isAdmin ? (
                            <Link
                              to="/admin/products"
                              onClick={(e) => e.stopPropagation()}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5"
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
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
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
            <div className="flex items-center justify-center gap-2 pt-6">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNumber = i + 1;
                const isCurrent = pageNumber === pagination.page;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', pageNumber.toString());
                      setSearchParams(newParams);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
