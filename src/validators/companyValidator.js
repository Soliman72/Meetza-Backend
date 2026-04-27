exports.validateProvisionCompany = (body) => {
  const name = body?.name;
  if (!name || String(name).trim() === "") {
    const e = new Error("Company name is required");
    e.status = 400;
    throw e;
  }
  if (body.domains !== undefined && !Array.isArray(body.domains)) {
    const e = new Error("domains must be an array when provided");
    e.status = 400;
    throw e;
  }
};
