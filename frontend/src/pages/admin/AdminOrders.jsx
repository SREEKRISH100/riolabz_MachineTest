import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  X,
  Edit2,
  ChevronRight,
  Eye,
} from 'lucide-react';
import api from '../../services/api';

const statusList = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const openStatusModal = (ord) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setStatusNote('');
    setErrorMsg('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setErrorMsg('');

    try {
      await api.patch(`/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: statusNote || `Status updated to ${newStatus} by admin`,
      });

      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer orders, advance status workflows, and audit stock allocations
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Order number, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Order Statuses</option>
          {statusList.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Customer & Contact</th>
                  <th className="px-6 py-3.5">Items & Qty</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{ord.shippingAddress?.fullName}</p>
                      <p className="text-[10px] text-slate-400">{ord.shippingAddress?.phone}</p>
                      <p className="text-[10px] text-slate-400">{ord.customer?.email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">
                        {ord.items?.length} item{ord.items?.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">
                        {ord.items?.map((i) => i.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 font-extrabold text-slate-900">
                      ₹{ord.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.status === 'Cancelled'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setViewingOrder(ord)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1 border border-slate-200"
                        title="View all details of this order"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => openStatusModal(ord)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Update Order Status</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Transition Status To
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {statusList.map((st) => (
                    <option key={st} value={st}>
                      {st} {st === selectedOrder.status ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Transitions follow: Pending &rarr; Confirmed &rarr; Processing &rarr; Shipped &rarr; Delivered (or Cancelled).
                  Setting to Cancelled automatically restores stock.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Audit Log Note
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Courier airway bill assigned / Stock allocated"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Apply Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Complete Order Details</h3>
                  <p className="text-xs text-indigo-300 font-mono">{viewingOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Order Status & Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{viewingOrder.status}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    {viewingOrder.paymentMethod} ({viewingOrder.paymentStatus})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                  <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                    ₹{viewingOrder.totalAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Placed On</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    {new Date(viewingOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Customer Details
                  </span>
                  <p className="font-bold text-slate-900">{viewingOrder.customer?.name || viewingOrder.shippingAddress?.fullName}</p>
                  <p className="text-slate-600">Email: {viewingOrder.customer?.email || 'N/A'}</p>
                  <p className="text-slate-600">Phone: {viewingOrder.shippingAddress?.phone || viewingOrder.customer?.phone || 'N/A'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Shipping & Delivery Address
                  </span>
                  <p className="font-bold text-slate-900">{viewingOrder.shippingAddress?.fullName}</p>
                  <p className="text-slate-600">{viewingOrder.shippingAddress?.street}</p>
                  {viewingOrder.shippingAddress?.addressLine2 && (
                    <p className="text-slate-600">{viewingOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-slate-600">
                    {viewingOrder.shippingAddress?.city}, {viewingOrder.shippingAddress?.state} - {viewingOrder.shippingAddress?.zipCode}
                  </p>
                  <p className="text-slate-400">{viewingOrder.shippingAddress?.country}</p>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block">
                  Purchased Items ({viewingOrder.items?.length || 0})
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {viewingOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.image ||
                            item.product?.images?.[0] ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'
                          }
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-slate-50"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-slate-400 text-[11px]">
                            Qty: {item.quantity} &times; ₹{item.price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        ₹{item.subtotal?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Taxes */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Items Subtotal</span>
                    <span>₹{viewingOrder.itemsSubtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (5%)</span>
                    <span>₹{viewingOrder.tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping Fee</span>
                    <span>{viewingOrder.shippingFee === 0 ? 'Free' : `₹${viewingOrder.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
                    <span>₹{viewingOrder.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Audit History */}
              {viewingOrder.statusHistory && viewingOrder.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block">
                    Status Audit History
                  </span>
                  <div className="space-y-1.5">
                    {viewingOrder.statusHistory.map((h, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-700">
                          <strong className="text-slate-900">{h.status}:</strong> {h.note || 'No note'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(h.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const ord = viewingOrder;
                  setViewingOrder(null);
                  openStatusModal(ord);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
