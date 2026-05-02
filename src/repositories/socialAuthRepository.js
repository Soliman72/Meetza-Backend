const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.findByProviderAndProviderId = async (provider, providerId) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ? LIMIT 1",
    [provider, providerId]
  );
  return rows[0] || null;
};

exports.insert = async (user_id, provider, provider_id) => {
  const id = uuidv4();
  await db.promise().query(
    "INSERT INTO social_auth (id, user_id, provider, provider_id) VALUES (?, ?, ?, ?)",
    [id, user_id, provider, provider_id]
  );
  return { id, user_id, provider, provider_id };
};
