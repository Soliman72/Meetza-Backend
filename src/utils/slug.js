const slugify = require("slugify");
const videoRepo = require("../repositories/videoRepository");

function generateSlug(title) {
  return slugify(title || "", {
    lower: true,
    strict: true,
    trim: true,
  });
}

async function createUniqueVideoSlug(title) {
    const slug = generateSlug(title);

    try {
    
      await videoRepo.addSlug(slug);
    
    } catch (err) {
    
      if (err.code === "ER_DUP_ENTRY") {
    
        const newSlug = slug + "-" + Date.now();
        await videoRepo.addSlug(newSlug);
    
      }
    }
    return slug;

}

module.exports = { createUniqueVideoSlug };