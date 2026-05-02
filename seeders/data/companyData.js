const { v4: uuidv4 } = require("uuid");
module.exports = {
  id: uuidv4(),
  name: "Meetza",
  is_active: true,

  system_name: "Meetza",
  logo_url: null,
  system_name_color: "#185A9D",
  theme: "light",

  auth_email_enabled: true,
  auth_google_enabled: true,

  domains: [
    {
      domain_name: "meetza.com",
      auth: { email: true, google: true },
    },
    {
      domain_name: "gmail.com",
      auth: { email: true, google: true },
    },
  ],

  terms_html: `
<h1>Terms of Service</h1>
<p><em>Last updated: April 2026</em></p>
<p>These Terms describe how you can use Meetza. This is a placeholder page that can be expanded later with your official terms.</p>
<h2>Use of the service</h2>
<p>Use the app responsibly and follow applicable rules. Do not abuse, disrupt, or attempt to harm the service.</p>
<h2>Account registration (roles)</h2>
<p>Leaders are registered by the system team. A leader should provide a seed file that contains the list of leaders accounts to the system supervisor so those accounts can be created.</p>
<p>Only members can create accounts via the Sign Up flow.</p>
`.trim(),
  privacy_html: `
<h1>Privacy Policy</h1>
<p><em>Last updated: April 2026</em></p>
<p>This page explains how Meetza handles personal data. This is a placeholder policy that can be replaced with your final privacy text.</p>
<h2>What we collect</h2>
<ul>
<li>Account information you provide.</li>
<li>Usage data needed to operate the service.</li>
</ul>
`.trim(),
  guidelines_html: `
<h1>Community Guidelines</h1>
<p><em>Last updated: April 2026</em></p>
<p>These guidelines help keep Meetza respectful and productive. This is a placeholder page.</p>
<h2>Be respectful</h2>
<p>No harassment, hate speech, or bullying. Respect privacy and consent when sharing content.</p>
`.trim(),
};