const express = require('express');
const router = express.Router();
const waybillController = require('../controllers/waybillController');
const deviceController = require('../controllers/deviceController');

// 公开运单详情接口（无需认证）
router.get('/waybills/:id', waybillController.getPublicWaybillDetail);
router.post('/waybills/:id/verify-password', waybillController.verifyWaybillPassword);

// 公开设备轨迹查询接口（无需认证）
router.get('/devices/:id/track-points', waybillController.getPublicDeviceTrackPoints);

// 公开设备查询接口（无需认证）
router.get('/devices/by-number/:deviceNumber', deviceController.getDeviceByNumber);
router.get('/devices/:id/location-history', deviceController.getPublicDeviceLocationHistory);

module.exports = router;
