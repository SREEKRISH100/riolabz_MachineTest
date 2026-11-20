import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      const data = res.data.data;
      setCartItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  // Listen for cart-updated event (fired upon guest cart merge during auth)
  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCart();
    };
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await api.post('/cart/items', { productId, quantity });
      const data = res.data.data;
      setCartItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add item to cart';
      return { success: false, message };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      const data = res.data.data;
      setCartItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update quantity';
      return { success: false, message };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      const data = res.data.data;
      setCartItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item';
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCartItems([]);
      setTotalAmount(0);
      setItemCount(0);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalAmount,
        itemCount,
        isLoading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
