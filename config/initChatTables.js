const db = require("./db");

/**
 * Ensures the tables required for realtime group chat exist.
 * Since the project does not currently use migrations, we run the DDL once on boot.
 */
const ensureChatTables = async () => {
  const createGroupMessageTable = `
    CREATE TABLE IF NOT EXISTS group_message (
      id CHAR(36) NOT NULL PRIMARY KEY,
      group_id CHAR(36) NOT NULL,
      sender_id CHAR(36) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_group_message_group_created (group_id, created_at),
      CONSTRAINT fk_group_message_group FOREIGN KEY (group_id)
        REFERENCES \`group\`(id) ON DELETE CASCADE,
      CONSTRAINT fk_group_message_user FOREIGN KEY (sender_id)
        REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await db.promise().query(createGroupMessageTable);
    console.log("[chat] group_message table ready");
  } catch (error) {
    console.error("[chat] Failed to ensure group_message table", error);
  }
};

module.exports = ensureChatTables;
