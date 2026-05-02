require("dotenv").config();

exports.DEFAULT_EMAIL_REJECTION_REASON = "Rejected via approval email";

const getConfiguredPublicApiBaseUrl = () => {
  const raw =
    process.env.API_BASE_URL ||
    process.env.BACKEND_URL ||
    process.env.APP_URL ||
    "";
  const trimmed = String(raw).trim().replace(/\/$/, "");
  return trimmed || null;
};

/**
 * Env often sets API_BASE_URL to ".../api" while routes are built as "/api/group/..." →
 * avoid ".../api/api/group/..." (Express mount is /api/group on the server origin).
 */
const stripTrailingApiMount = (baseUrl) => {
  let b = String(baseUrl || "").trim();
  while (b.endsWith("/")) b = b.slice(0, -1);
  if (b.length >= 4 && b.toLowerCase().endsWith("/api")) {
    b = b.slice(0, -4);
    while (b.endsWith("/")) b = b.slice(0, -1);
  }
  return b;
};

exports.getPublicApiBaseUrlFromRequest = (req) => {
  if (!req || typeof req.get !== "function") return null;
  const host = String(req.get("host") || "").trim();
  if (!host) return null;

  let proto = String(req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!proto) {
    proto = req.secure ? "https" : String(req.protocol || "http").replace(/:$/, "");
  }
  if (!/^https?$/.test(proto)) {
    proto = "https";
  }

  return `${proto}://${host}`.replace(/\/$/, "");
};

exports.getPublicApiBaseUrl = (req) => {
  const configured = getConfiguredPublicApiBaseUrl();
  const resolved =
    configured ||
    exports.getPublicApiBaseUrlFromRequest(req) ||
    "http://localhost:4000";
  return stripTrailingApiMount(resolved);
};

/** Full URL for GET /api/group/pending/email-action (single /api segment). */
exports.buildPendingGroupEmailActionUrl = (apiBase, token) =>
  `${stripTrailingApiMount(apiBase)}/api/group/pending/email-action?token=${encodeURIComponent(
    token
  )}`;

exports.getFrontendBaseUrl = () =>
  String(process.env.FRONTEND_URL || process.env.APP_PUBLIC_URL || "").replace(
    /\/$/,
    ""
  );

const appendQueryString = (baseUrl, queryWithoutLeadingQuestion) => {
  if (!queryWithoutLeadingQuestion) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${queryWithoutLeadingQuestion}`;
};

exports.buildPendingGroupEmailSuccessRedirectUrl = (frontendBase, decisionStatus) => {
  const q =
    decisionStatus === "approved"
      ? "groupEmailAction=approved"
      : "groupEmailAction=rejected";
  return appendQueryString(frontendBase, q);
};

exports.buildPendingGroupEmailErrorRedirectUrl = (frontendBase, message) => {
  const msg = message || "Something went wrong";
  return appendQueryString(
    frontendBase,
    `groupEmailAction=error&message=${encodeURIComponent(msg)}`
  );
};

exports.getPendingGroupEmailActionSuccessView = (data) => ({
  httpStatus: 200,
  heading: data.status === "approved" ? "Approved" : "Rejected",
  detail: data.message,
  success: true,
});

exports.getPendingGroupEmailActionErrorView = (err) => ({
  httpStatus: err?.status || 400,
  heading: "Could not complete action",
  detail: err?.message || "Something went wrong",
  success: false,
});

exports.buildPendingGroupEmailActionResultHtml = (heading, detail, success) => {
  const color = success ? "#0f172a" : "#b91c1c";
  const safe = String(detail || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Meetza</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f2f4f7;">
<table role="presentation" style="width:100%;border-collapse:collapse;background:#f2f4f7;">
<tr><td style="padding:48px 16px;">
<table role="presentation" style="width:100%;max-width:520px;margin:0 auto;background:#fff;border-radius:20px;
box-shadow:0 20px 60px rgba(15,23,42,0.12);">
<tr><td style="padding:36px 28px;text-align:center;">
<p style="margin:0 0 12px;color:${color};font-size:22px;font-weight:600;">${heading}</p>
<p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">${safe}</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
};
