const express = require('express');
const router = express.Router();
const controller = require('../controller/userController');
const { verifyToken } = require("../utils/verifyToken");


router.get('/', verifyToken, controller.getAllUsers);
router.get('/:id', verifyToken, controller.getUserById);
router.patch('/:id', verifyToken, controller.updateUser);
router.delete('/:id', verifyToken, controller.deleteUser);

module.exports = router;
