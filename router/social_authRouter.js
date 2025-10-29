const express = require('express');
const router = express.Router();
const controller = require('../controller/social_authController');

router.post('/', controller.createSocialAuth);
router.get('/', controller.getAllSocialAuths);
router.get('/:id', controller.getSocialAuthById);
router.put('/:id', controller.updateSocialAuth);
router.delete('/:id', controller.deleteSocialAuth);

module.exports = router;
