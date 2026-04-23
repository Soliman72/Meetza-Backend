const positionService = require("../services/positionService");

exports.createPosition = async (req, res) => {
  try {
    const data = await positionService.createPosition(req);
    res.status(201).json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || err });
  }
};

exports.getAllPositions = async (req, res) => {
  try {
    const rows = await positionService.getAllPositions(req);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPositionById = async (req, res) => {
  try {
    const row = await positionService.getPositionById(req);
    res.json(row);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.updatePosition = async (req, res) => {
  try {
    const data = await positionService.updatePosition(req);
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.deletePosition = async (req, res) => {
  try {
    await positionService.deletePosition(req.params.id);
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};
