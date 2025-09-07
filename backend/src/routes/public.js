const express = require('express');
const router = express.Router();
const waybillController = require('../controllers/waybillController');

// 公开运单详情接口（无需认证）
router.get('/waybills/:id', waybillController.getPublicWaybillDetail);
router.post('/waybills/:id/verify-password', waybillController.verifyWaybillPassword);

// 公开设备轨迹查询接口（无需认证）
router.get('/devices/:id/track-points', waybillController.getPublicDeviceTrackPoints);

module.exports = router;
