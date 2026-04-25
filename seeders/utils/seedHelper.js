async function insertIfNotExists(db, data) {
    const [rows] = await db.promise().query(
      `SELECT * FROM user WHERE email = ?`,
      [data.email]
    );
  
    if (rows.length === 0) {
      const keys = Object.keys(data);
      const values = Object.values(data);
  
      await db.promise().query(
        `INSERT INTO user (${keys.map(k => `\`${k}\``).join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
        values
      );
    }
  }
  
  module.exports = { insertIfNotExists };