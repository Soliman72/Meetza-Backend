const express = require('express');
const router = express.Router();
const controller = require('../controller/administratorController');

router.post('/', controller.createAdministrator);
router.get('/', controller.getAllAdministrators);
router.get('/:user_id', controller.getAdministratorById);
router.put('/:user_id', controller.updateAdministrator);
router.delete('/:user_id', controller.deleteAdministrator);

module.exports = router;
