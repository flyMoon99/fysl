const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const waybillController = require('../controllers/waybillController');
const { authenticateMember, authenticateAdmin, requireAdmin } = require('../middleware/auth');

// 会员认证相关路由（无需认证）
router.post('/login', memberController.memberLogin);
router.post('/register', memberController.memberRegister);

// 会员个人功能（需要会员认证）
router.get('/me', authenticateMember, memberController.getCurrentMember);
router.put('/profile', authenticateMember, memberController.updateProfile);
router.put('/change-password', authenticateMember, memberController.changePassword);
router.get('/login-history', authenticateMember, memberController.getLoginHistory);
router.get('/devices', authenticateMember, memberController.getMemberDevices);

// 获取会员设备地图数据（更具体的路由放在前面）
router.get('/devices/:id/map-data', authenticateMember, memberController.getMemberDeviceMapData);

// 获取会员设备轨迹点数据（更具体的路由放在前面）
router.get('/devices/:id/track-points', authenticateMember, memberController.getMemberDeviceTrackPoints);

// 获取会员设备详情（通用路由放在最后）
router.get('/devices/:id', authenticateMember, memberController.getMemberDeviceDetail);

// 运单管理功能（需要会员认证）
router.get('/waybills', authenticateMember, waybillController.getWaybills);
router.get('/waybills/:id', authenticateMember, waybillController.getWaybillDetail);
router.post('/waybills', authenticateMember, waybillController.createWaybill);
router.put('/waybills/:id', authenticateMember, waybillController.updateWaybill);
router.delete('/waybills/:id', authenticateMember, waybillController.deleteWaybill);

// 会员管理功能（需要管理员认证）
router.get('/list', authenticateAdmin, requireAdmin, memberController.getMemberList);
router.post('/create', authenticateAdmin, requireAdmin, memberController.createMember);
router.get('/:id', authenticateAdmin, requireAdmin, memberController.getMemberDetail);
router.put('/:id', authenticateAdmin, requireAdmin, memberController.updateMember);
router.delete('/:id', authenticateAdmin, requireAdmin, memberController.deleteMember);

module.exports = router;
