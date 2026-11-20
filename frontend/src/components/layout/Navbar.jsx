import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  User,
  Shield,
  Search,
  LogOut,
  Package,
  Layers,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout, openAuth } = useAuth();
  const { itemCount } = useCart();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories tree
    api
      .get('/categories/tree')
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left End: Logo & Search Field */}
          <div className="flex items-center gap-4 sm:gap-6 flex-1 max-w-xl">
            {/* Logo */}
            <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  NexStore
                </span>
                <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">
                  Online Store
                </span>
              </div>
            </Link>

            {/* Search field on the left end */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex flex-1 max-w-md relative items-center"
            >
              <input
                type="text"
                placeholder="Search products by name, SKU, or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-9 pr-4 py-2 rounded-full border border-transparent focus:border-blue-500 focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            </form>
          </div>

          {/* Right End: Navigation Links & Action Buttons */}
          <div className="flex items-center gap-5 sm:gap-6 flex-shrink-0 ml-auto">
            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link to="/products" className="hover:text-blue-600 transition-colors">
                All Products
              </Link>

              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoryDropdown(!categoryDropdown)}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors py-2"
                >
                  Categories
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {categoryDropdown && (
                  <div
                    onMouseLeave={() => setCategoryDropdown(false)}
                    className="absolute right-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 font-semibold text-xs text-slate-400 uppercase tracking-wider">
                      Browse Categories
                    </div>
                    {categories.map((cat) => (
                      <div key={cat._id} className="px-2">
                        <Link
                          to={`/products?category=${cat.slug}`}
                          onClick={() => setCategoryDropdown(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <span className="font-medium">{cat.name}</span>
                          {cat.children && cat.children.length > 0 && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {cat.children.length} sub
                            </span>
                          )}
                        </Link>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 mt-2 pt-2 px-3">
                      <Link
                        to="/products"
                        onClick={() => setCategoryDropdown(false)}
                        className="text-xs text-center block text-blue-600 hover:underline font-semibold"
                      >
                        View All in Store &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Cart Button - Only for Customers */}
              {!isAdmin && (
                <Link
                  to="/cart"
                  className="relative p-2.5 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Profile / Auth Button */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors text-sm font-medium"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdown && (
                    <div
                      onMouseLeave={() => setUserDropdown(false)}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Signed in as
                        </p>
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {user?.role}
                        </span>
                      </div>

                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          to="/my-orders"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          My Orders
                        </Link>
                      )}

                      <Link
                        to={isAdmin ? "/admin/profile" : "/profile"}
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Profile Settings
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={async () => {
                          setUserDropdown(false);
                          await logout();
                          navigate('/', { replace: true });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuth('login')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-sm pl-10 pr-4 py-2 rounded-lg"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
            <div className="flex flex-col space-y-2 pt-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 font-medium py-1.5"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 font-medium py-1.5"
              >
                All Products
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-indigo-600 font-semibold py-1.5"
                >
                  Admin Management
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
