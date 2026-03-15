const slugify = require("slugify");

function generateSlug(title) {
  return slugify(title || "", {
    lower: true,
    strict: true,
    trim: true,
  });
}

async function createUniqueVideoSlug(title, db) {
    const slug = generateSlug(title);

    try {
    
      await db.promise().query(
        "INSERT INTO video (slug) VALUES (?)",
        [slug]
      );
    
    } catch (err) {
    
      if (err.code === "ER_DUP_ENTRY") {
    
        const newSlug = slug + "-" + Date.now();
    
        await db.promise().query(
          "INSERT INTO video (slug) VALUES (?)",
          [newSlug]
        );
    
      }
    }
    return slug;

}

module.exports = { createUniqueVideoSlug };