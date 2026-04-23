const contactService = require("../services/contactService");

exports.createContact = async (req, res) => {
  try {
    const data = await contactService.createContact(req.body);
    res.status(201).json({
      success: true,
      message: "Contact message sent successfully",
      data,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("Contact creation error:", error);
    res.status(status).json({
      success: false,
      message:
        status === 500
          ? "Failed to send contact message"
          : error.message,
      ...(status === 500 ? { error: error.message } : {}),
    });
  }
};
