const express = require('express');
const router = express.Router();
const controller = require('../controller/social_authController');
const { verifyToken } = require("../utils/verifyToken");

router.post('/', controller.createSocialAuth);
router.get('/', verifyToken, controller.getAllSocialAuths);
router.get('/:id', verifyToken, controller.getSocialAuthById);
router.patch('/:id', verifyToken, controller.updateSocialAuth);
router.delete('/:id', verifyToken, controller.deleteSocialAuth);

module.exports = router;
