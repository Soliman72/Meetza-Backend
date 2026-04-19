const jwt = require("jsonwebtoken");

function redirectWithError(errorCode, errorMessage, res, type = "signin", redirect) {
  const baseUrl = redirect.includes("https://meetza-front-end.vercel.app")
    ? "https://meetza-front-end.vercel.app"
    : "https://meetza-front-end-admin.vercel.app";
  const redirectPath = type == "signin" ? "/login" : "/signup";
  const separator = redirect.includes("?") ? "&" : "?";
  return res.redirect(
    `${baseUrl}${redirectPath}${separator}error=${errorCode}&error_message=${encodeURIComponent(errorMessage)}&redirect_url=${redirect} &type=${type}`,
  );
}

function proceedWithUser(user, redirectUrl, res) {
  const safeUser = {
    name: user.name,
    email: user.email,
    user_photo: user.user_photo,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    user_photo: user.user_photo,
  };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });

  const allowedOrigins = [
    "https://meetza-front-end.vercel.app",
    "https://meetza-front-end-admin.vercel.app",
    "http://localhost:3000",
  ];

  try {
    const url = new URL(redirectUrl);

    if (
      process.env.NODE_ENV === "production" &&
      !allowedOrigins.some((origin) =>
        url.origin.includes(origin.replace(/^https?:\/\//, "")),
      )
    ) {
      return res.redirect("http://localhost:3000/login?error=invalid_redirect");
    }

    url.searchParams.set("token", token);
    url.searchParams.set("user", encodeURIComponent(JSON.stringify(safeUser)));

    return res.redirect(url.toString());
  } catch (urlError) {
    console.error("URL error:", urlError);
    const separator = redirectUrl.includes("?") ? "&" : "?";
    return res.redirect(
      `${redirectUrl}${separator}token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`,
    );
  }
}

module.exports = {
  redirectWithError,
  proceedWithUser,
};
