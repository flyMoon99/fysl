const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

// 管理员登录（无需认证）
router.post('/login', adminController.adminLogin);

// 获取当前管理员信息（需要认证）
router.get('/me', authenticateAdmin, adminController.getCurrentAdmin);

// 管理员管理路由（需要超级管理员权限）
router.get('/list', authenticateAdmin, requireAdmin, adminController.getAdminList);
router.post('/create', authenticateAdmin, requireSuperAdmin, adminController.createAdmin);
router.get('/:id', authenticateAdmin, requireAdmin, adminController.getAdminDetail);
router.put('/:id', authenticateAdmin, requireSuperAdmin, adminController.updateAdmin);
router.delete('/:id', authenticateAdmin, requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;
