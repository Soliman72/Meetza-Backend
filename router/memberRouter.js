const express = require('express');
const router = express.Router();
const controller = require('../controller/memberController');

router.post('/', controller.createMember);
router.get('/', controller.getAllMembers);
router.get('/:user_id', controller.getMemberById);
router.put('/:user_id', controller.updateMember);
router.delete('/:user_id', controller.deleteMember);

module.exports = router;
