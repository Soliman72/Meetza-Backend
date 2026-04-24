const domainService = require("../services/domainService");
const { success: resSuccess, error: resError } = require("../dto");

exports.getAllDomains = async (req, res) => {
  try {
    const domains = await domainService.getAllDomains();
    res.status(200).json(resSuccess(domains));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.getDomainById = async (req, res) => {
  try {
    const domain = await domainService.getDomainById(req.params.id);
    res.status(200).json(resSuccess(domain));
  } catch (e) {
    res.status(404).json(resError(e.message));
  }
};

exports.createDomain = async (req, res) => {
  try {
    const newDomain = await domainService.createDomain(req.body);
    res.status(201).json(resSuccess(newDomain));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const updatedDomain = await domainService.updateDomain(req.params.id, req.body);
    res.status(200).json(resSuccess(updatedDomain));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    await domainService.deleteDomain(req.params.id);
    res.status(200).json(resSuccess(null, "Domain deleted successfully"));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};
