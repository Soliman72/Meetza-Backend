const express = require("express");
const router = express.Router();
const contactController = require("../controller/contactController");

// Public route - anyone can submit a contact message
router.post("/", contactController.createContact);

module.exports = router;
