import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cartItems, totalAmount, updateQuantity, removeFromCart, clearCart, isLoading } =
    useCart();
  const { isAuthenticated, isAdmin, openAuth } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  // Calculations
  const tax = Math.round(totalAmount * 0.05 * 100) / 100;
  const shippingFee = totalAmount > 1000 || totalAmount === 0 ? 0 : 50;
  const finalTotal = Math.round((totalAmount + tax + shippingFee) * 100) / 100;

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      openAuth('login', '/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our product catalog and add products to your cart.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          Browse Products
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cartItems.length} distinct item{cartItems.length > 1 ? 's' : ''} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-5 transition-all hover:border-slate-300"
              >
                {/* Thumbnail */}
                <Link
                  to={`/product/${product._id}`}
                  className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100 block hover:opacity-90 transition-opacity"
                >
                  <img
                    src={
                      product.images?.[0] ||
                      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300';
                    }}
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    SKU: {product.sku}
                  </span>
                  <Link
                    to={`/product/${product._id}`}
                    className="block font-bold text-slate-900 hover:text-blue-600 text-sm truncate"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-slate-500">Unit Price: ₹{item.price.toLocaleString()}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(product._id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className="p-2 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(product._id, item.quantity + 1)}
                    disabled={item.quantity >= product.stock}
                    className="p-2 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right sm:w-28">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    ₹{item.subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(product._id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 h-fit sticky top-24">
          <h3 className="text-base font-bold text-slate-900">Order Summary</h3>

          <div className="space-y-3 text-xs text-slate-600 border-b border-slate-100 pb-4">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (5%)</span>
              <span className="font-semibold text-slate-900">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase">Free</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <div>
              <span className="text-sm font-extrabold text-slate-900 block">Total Amount</span>
              <span className="text-[10px] text-slate-400">Calculated strictly on backend</span>
            </div>
            <span className="text-2xl font-black text-slate-900">₹{finalTotal.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckoutClick}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Atomic stock validation upon placement
          </div>
        </div>
      </div>
    </div>
  );
}
