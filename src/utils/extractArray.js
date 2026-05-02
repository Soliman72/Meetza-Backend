function extractArray(body, key) {
    if (!body) return [];
    let result = [];
  
    if (body[key]) {
      const val = body[key];
      if (Array.isArray(val)) {
        result = result.concat(val);
      } else if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) result = result.concat(parsed);
          else result.push(val);
        } catch (e) {
          result = result.concat(val.split(",").map((s) => s.trim()).filter((s) => !!s));
        }
      } else {
        result.push(val);
      }
    }
  
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escapedKey}\\[\\d*\\]$`);
  
    Object.keys(body).forEach((k) => {
      if (regex.test(k)) {
        const val = body[k];
        if (val !== undefined && val !== null) {
          result.push(val);
        }
      }
    });
  
    return [...new Set(result.map((i) => i.toString().trim()))];
}
module.exports = { extractArray };