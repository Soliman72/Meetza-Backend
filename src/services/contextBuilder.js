const siteInfo = require("../data/siteInfo");
const repo = require("../repositories/groupRepository");

async function buildContext(message) {
    const groups = await repo.getAllGroups();

  const groupsText = groups
    .map(g => `Group: ${g.group_name} - ${g.description}`)
    .join("\n");

  return `
${siteInfo}

Groups:
${groupsText}
`;
}

module.exports = buildContext;