const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userAccount = payload.account;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token 已过期，请重新登录' });
  }
};
