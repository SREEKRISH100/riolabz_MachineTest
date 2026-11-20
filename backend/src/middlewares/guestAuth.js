const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const guestAuth = async (req, res, next) => {
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_testround_2026_midlevel_dev';

    // 1. Check if user is logged in via Authorization header or token cookie
    let userToken = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      userToken = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      userToken = req.cookies.token;
    }

    if (userToken) {
      try {
        const decoded = jwt.verify(userToken, secret);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
          req.isCustomer = true;

          // Decode guest token if present alongside auth token (for cart merging)
          const guestToken = req.headers['x-guest-token'] || (req.cookies && req.cookies.guest_token);
          if (guestToken) {
            try {
              const decodedGuest = jwt.verify(guestToken, secret);
              req.guestId = decodedGuest.guestId;
            } catch (err) {}
          }

          return next();
        }
      } catch (err) {
        // Token invalid or expired, continue to guest flow
      }
    }

    // 2. Check for guest token in header or cookie
    const guestToken = req.headers['x-guest-token'] || (req.cookies && req.cookies.guest_token);
    if (guestToken) {
      try {
        const decodedGuest = jwt.verify(guestToken, secret);
        req.guestId = decodedGuest.guestId;
        req.isCustomer = false;
        return next();
      } catch (err) {
        // Guest token expired, generate a new one below
      }
    }

    // 3. Generate new guest session
    const newGuestId = crypto.randomUUID();
    const newGuestToken = jwt.sign({ guestId: newGuestId }, secret, { expiresIn: '30d' });

    res.cookie('guest_token', newGuestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    req.guestId = newGuestId;
    req.generatedGuestToken = newGuestToken;
    req.isCustomer = false;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { guestAuth };
