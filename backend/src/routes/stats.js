const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateAdmin, requireAdmin } = require('../middleware/auth');

// 所有统计API都需要管理员认证
router.use(authenticateAdmin);
router.use(requireAdmin);

// 获取系统统计信息
router.get('/system', statsController.getSystemStats);

// 获取会员统计信息
router.get('/members', statsController.getMemberStats);

// 获取登录统计信息
router.get('/logins', statsController.getLoginStats);

module.exports = router;