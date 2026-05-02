const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const query = (sql, params = []) => db.promise().execute(sql, params);

let ensureTablePromise;

async function ensureCacheTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = query(`
      CREATE TABLE IF NOT EXISTS chat_bot_cache (
        id VARCHAR(36) NOT NULL,
        question_key VARCHAR(512) NOT NULL,
        normalized_question TEXT NOT NULL,
        reply LONGTEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        hit_count INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_chat_bot_cache_question_key (question_key),
        INDEX idx_chat_bot_cache_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
  await ensureTablePromise;
}

exports.getValidReplyByKey = async (questionKey) => {
  await ensureCacheTable();

  const [rows] = await query(
    `SELECT reply
     FROM chat_bot_cache
     WHERE question_key = ?
       AND expires_at > NOW()
     LIMIT 1`,
    [questionKey]
  );

  if (!rows.length) return null;

  await query(
    `UPDATE chat_bot_cache
     SET hit_count = hit_count + 1
     WHERE question_key = ?`,
    [questionKey]
  );

  return rows[0].reply;
};

exports.upsertReply = async ({ questionKey, normalizedQuestion, reply, ttlMinutes }) => {
  await ensureCacheTable();

  await query(
    `INSERT INTO chat_bot_cache (id, question_key, normalized_question, reply, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
     ON DUPLICATE KEY UPDATE
       normalized_question = VALUES(normalized_question),
       reply = VALUES(reply),
       expires_at = VALUES(expires_at),
       updated_at = CURRENT_TIMESTAMP`,
    [uuidv4(), questionKey, normalizedQuestion, reply, ttlMinutes]
  );
};

exports.clearExpired = async () => {
  await ensureCacheTable();
  await query("DELETE FROM chat_bot_cache WHERE expires_at <= NOW()");
};
