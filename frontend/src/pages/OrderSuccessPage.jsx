import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Truck } from 'lucide-react';

export default function OrderSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return <Navigate to="/my-orders" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Order Confirmed
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-sm text-slate-500">
          Your order number is <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
        </p>
      </div>

      {/* Order Card Preview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 text-left shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Delivery To
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Status: {order.status}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                order.paymentStatus === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {order.paymentStatus === 'Paid' ? 'Paid Successfully ✓' : 'Pay on Delivery'}
            </span>
          </div>
        </div>

        <div className="text-sm text-slate-700">
          <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
          <p>{order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
          <p className="text-xs text-slate-500 mt-1">Phone: {order.shippingAddress?.phone}</p>
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-2">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-slate-800">
                {item.name} &times; {item.quantity}
              </span>
              <span className="font-bold text-slate-900">₹{item.subtotal?.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
          <span className="text-xs font-bold text-slate-500">Total Paid / Payable</span>
          <span className="text-xl font-black text-slate-900">₹{order.totalAmount?.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        <Link
          to={`/orders/${order._id}`}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          Track Order
        </Link>

        <Link
          to="/products"
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
