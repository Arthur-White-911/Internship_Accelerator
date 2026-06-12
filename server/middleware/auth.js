const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = Number(payload.userId);
    req.userAccount = payload.account;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};
