
exports.normalizeToArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter((v) => !!v);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  return [value];
}

exports.normalizeAndValidate = (value, allowedValues) => {
  let arr = [];

  if (Array.isArray(value)) arr = value;
  else if (typeof value === "string") arr = value.split(",");

  return arr
    .map((v) => v.toString().trim())
    .filter((v) => allowedValues.includes(v));
}