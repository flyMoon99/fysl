const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticateAdmin, requireAdmin } = require('../middleware/auth');

// 设备管理功能（需要管理员认证）
// 获取设备列表
router.get('/list', authenticateAdmin, requireAdmin, deviceController.getDeviceList);

// 获取设备详情
router.get('/:id', authenticateAdmin, requireAdmin, deviceController.getDeviceDetail);

// 获取设备统计信息
router.get('/stats/overview', authenticateAdmin, requireAdmin, deviceController.getDeviceStats);

// 获取设备位置历史
router.get('/:id/locations', authenticateAdmin, requireAdmin, deviceController.getDeviceLocationHistory);

// 获取设备轨迹统计
router.get('/:id/track-stats', authenticateAdmin, requireAdmin, deviceController.getDeviceTrackStats);

// 同步功能（需要管理员认证）
// 同步所有设备信息
router.post('/sync/all', authenticateAdmin, requireAdmin, deviceController.syncAllDevices);

// 同步指定设备的历史轨迹
router.post('/sync/:deviceNumber/track', authenticateAdmin, requireAdmin, deviceController.syncDeviceTrack);

// 同步设备当前位置
router.post('/sync/:deviceNumber/location', authenticateAdmin, requireAdmin, deviceController.syncDeviceCurrentLocation);

// 批量分配设备客户
router.post('/batch-assign-customer', authenticateAdmin, requireAdmin, deviceController.batchAssignCustomer);

module.exports = router;
