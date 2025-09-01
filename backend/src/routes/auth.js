const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { optionalAuth } = require('../middleware/auth');

// 通用认证路由
router.get('/user-info', optionalAuth, authController.getUserInfo);
router.get('/verify-token', optionalAuth, authController.verifyToken);
router.post('/logout', optionalAuth, authController.logout);

module.exports = router;
