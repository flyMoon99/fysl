const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticateMember, authenticateAdmin, requireAdmin } = require('../middleware/auth');

// 会员认证相关路由（无需认证）
router.post('/login', memberController.memberLogin);
router.post('/register', memberController.memberRegister);

// 会员个人功能（需要会员认证）
router.get('/me', authenticateMember, memberController.getCurrentMember);
router.put('/profile', authenticateMember, memberController.updateProfile);
router.put('/change-password', authenticateMember, memberController.changePassword);
router.get('/login-history', authenticateMember, memberController.getLoginHistory);

// 会员管理功能（需要管理员认证）
router.get('/list', authenticateAdmin, requireAdmin, memberController.getMemberList);
router.post('/create', authenticateAdmin, requireAdmin, memberController.createMember);
router.get('/:id', authenticateAdmin, requireAdmin, memberController.getMemberDetail);
router.put('/:id', authenticateAdmin, requireAdmin, memberController.updateMember);
router.delete('/:id', authenticateAdmin, requireAdmin, memberController.deleteMember);

module.exports = router;
