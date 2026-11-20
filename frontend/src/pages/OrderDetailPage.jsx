import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, Truck, Package, AlertCircle, X, ShieldAlert, Eye, Printer } from 'lucide-react';
import api from '../services/api';

const statusSteps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const loadOrder = () => {
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setCancelling(true);
    setCancelError('');

    const finalReason = cancelReason === 'Other' ? (customReason.trim() || 'Other reason') : cancelReason;

    try {
      await api.post(`/orders/${id}/cancel`, { reason: finalReason });
      setIsCancelModalOpen(false);
      loadOrder();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/my-orders" className="text-blue-600 font-bold hover:underline">
          &larr; Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';
  const canCancel = ['Pending', 'Confirmed', 'Processing'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/my-orders"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-mono font-bold text-blue-600 uppercase">Order Details</span>
            <h1 className="text-2xl font-extrabold text-slate-900">{order.orderNumber}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              order.status === 'Confirmed'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : order.status === 'Delivered'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : order.status === 'Cancelled'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {order.status}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              order.paymentStatus === 'Paid'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : order.paymentStatus === 'Refunded'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {order.paymentStatus === 'Paid'
              ? 'Paid ✓'
              : order.paymentStatus === 'Refunded'
              ? 'Refunded ✓'
              : 'Payment: Pending'}
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            title="View printable invoice"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>View Invoice</span>
          </button>
          {canCancel ? (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-3 py-1 rounded-full text-xs font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Cancel Order
            </button>
          ) : order.status === 'Shipped' ? (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-200 text-purple-700 bg-purple-50 flex items-center gap-1.5 cursor-not-allowed"
              title="Orders cannot be cancelled once handed over to the courier"
            >
              <Truck className="w-3.5 h-3.5 text-purple-600" />
              Cannot Cancel (Shipped)
            </span>
          ) : null}
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Tracking Timeline
        </h3>

        {order.status === 'Shipped' && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-purple-900 text-sm">
            <Truck className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600" />
            <div>
              <p className="font-bold">Order in Transit &bull; Cancellation Unavailable</p>
              <p className="text-xs text-purple-700 mt-0.5">
                This order has already been shipped and handed over to our courier partner. Orders in transit cannot be cancelled. You can refuse delivery at your doorstep or initiate a return/exchange once delivered.
              </p>
            </div>
          </div>
        )}

        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This order has been cancelled.</p>
              <p className="text-xs text-red-600 mt-0.5">
                {order.cancellationReason
                  ? `Reason: ${order.cancellationReason}`
                  : 'All reserved items have been restored to inventory.'}
                {order.paymentStatus === 'Refunded' && ' Payment refund has been initiated to your account.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex justify-between items-center max-w-2xl mx-auto py-4">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
            <div
              className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%`,
              }}
            ></div>

            {statusSteps.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-2 font-semibold ${
                      isCurrent ? 'text-blue-600 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Status History Notes */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="text-xs font-bold text-slate-700">Audit History:</span>
            {order.statusHistory.map((h, i) => (
              <div key={i} className="text-xs flex items-center justify-between text-slate-500">
                <span>
                  <strong className="text-slate-800">{h.status}:</strong> {h.note || 'No note'}
                </span>
                <span className="text-[11px]">
                  {new Date(h.timestamp).toLocaleDateString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items & Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Items in Order
          </h3>
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center">
                    <img
                      src={
                        item.image ||
                        item.product?.images?.[0] ||
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200'
                      }
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-slate-400">Qty: {item.quantity} &times; ₹{item.price?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-extrabold text-slate-900">
                    ₹{item.subtotal?.toLocaleString()}
                  </span>
                  {(item.product?._id || item.product) && (
                    <Link
                      to={`/product/${item.product?._id || item.product}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                      title="View product details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₹{order.itemsSubtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (5%)</span>
              <span>₹{order.tax?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Shipping</span>
              <span>{order.shippingFee === 0 ? 'Free' : `₹${order.shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Amount</span>
              <span>₹{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Shipping Address
          </h3>
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.street}</p>
            {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
            <p className="text-slate-400">{order.shippingAddress?.country}</p>
            <p className="pt-2 text-slate-500">Contact: {order.shippingAddress?.phone}</p>
          </div>

          <div className="border-t border-slate-100 pt-4 text-xs space-y-2">
            <span className="font-bold text-slate-700 block">Payment Details</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-800">
                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : order.paymentStatus === 'Refunded'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {order.paymentStatus === 'Paid'
                  ? 'Paid Successfully ✓'
                  : order.paymentStatus === 'Refunded'
                  ? 'Refunded ✓'
                  : 'Pay on Delivery'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-6 relative">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold">Cancel Order #{order.orderNumber}</h3>
              <p className="text-xs text-red-100 mt-1">
                Please let us know why you are cancelling this order.
              </p>
            </div>

            <form onSubmit={handleCancelOrder} className="p-6 space-y-4">
              {cancelError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Delivery time is too long">Delivery time is too long</option>
                  <option value="Need to change shipping address or items">
                    Need to change shipping address or items
                  </option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Describe Reason
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Provide details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  What happens next?
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-700">
                  <li>Reserved stock is immediately returned to inventory.</li>
                  {order.paymentStatus === 'Paid' ? (
                    <li>Refund of ₹{order.totalAmount?.toLocaleString()} will be initiated.</li>
                  ) : (
                    <li>No payment will be collected on delivery.</li>
                  )}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={cancelling}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
