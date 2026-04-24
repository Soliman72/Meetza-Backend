const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const authRepository = require("../repositories/authRepository");
const socialAuthRepository = require("../repositories/socialAuthRepository");
const domainRepository = require("../repositories/domainRepository");

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

async function handleGoogleOAuthCallback(err, profile, req, res) {
  let redirectUrl = "http://localhost:3000/home";
  let type = "signin";
  let stateObj = {};

  if (req.query.state) {
    try {
      stateObj = JSON.parse(req.query.state);
      redirectUrl = stateObj.redirect || redirectUrl;
      type = stateObj.type || type;
    } catch (parseError) {
      console.error("State parse error:", parseError);
      return redirectWithError(
        "invalid_state",
        "Invalid state parameter",
        res,
        "signin",
        redirectUrl
      );
    }
  }

  try {
    if (err) {
      console.error("Passport error:", err);
      return redirectWithError(
        "oauth_failed",
        "OAuth authentication failed",
        res,
        type,
        redirectUrl
      );
    }

    if (!profile) {
      return redirectWithError(
        "no_profile",
        "No user profile received from Google",
        res,
        type,
        redirectUrl
      );
    }

    const role = stateObj.role || "Member";
    const email = profile._json?.email || profile.emails?.[0]?.value;

    if (email) {
      const domainName = email.split('@')[1];
      if (domainName) {
        const domainObj = await domainRepository.findByDomainName(domainName.toLowerCase());
        if (domainObj && !domainObj.auth_google_enabled) {
          return redirectWithError(
            "google_auth_disabled",
            "Google Sign-In is disabled for your organization. Please use Email/Password.",
            res,
            type,
            redirectUrl
          );
        }
      }
    }

    const providerId = profile.id;
    const name =
      profile.displayName ||
      profile._json?.name ||
      (profile.name?.givenName && profile.name?.familyName
        ? `${profile.name.givenName} ${profile.name.familyName}`
        : null);

    if (!email || !providerId || !name) {
      return redirectWithError(
        "missing_data",
        "Missing required profile data from Google",
        res,
        type,
        redirectUrl
      );
    }

    let dbUser;

    if (type === "signin") {
      const link = await socialAuthRepository.findByProviderAndProviderId(
        "google",
        providerId
      );

      if (!link) {
        const existingUser = await authRepository.findByEmail(email);
        if (!existingUser) {
          return redirectWithError(
            "user_not_found",
            "User not found. Please sign up first.",
            res,
            type,
            redirectUrl
          );
        }

        dbUser = existingUser;
        await socialAuthRepository.insert(dbUser.id, "google", providerId);
        await authRepository.markEmailVerifiedByUserId(dbUser.id);
        return proceedWithUser(dbUser, redirectUrl, res);
      }

      dbUser = await authRepository.findById(link.user_id);
      if (!dbUser) {
        return redirectWithError(
          "user_not_found",
          "User not found in database",
          res,
          type,
          redirectUrl
        );
      }
      return proceedWithUser(dbUser, redirectUrl, res);
    }

    if (type === "signup") {
      const existingLink = await socialAuthRepository.findByProviderAndProviderId(
        "google",
        providerId
      );
      if (existingLink) {
        return redirectWithError(
          "already_linked",
          "This Google account is already linked to an existing account",
          res,
          type,
          redirectUrl
        );
      }

      const existingEmail = await authRepository.findByEmail(email);
      if (existingEmail) {
        return redirectWithError(
          "email_exists",
          "Email already exists. Please sign in instead.",
          res,
          type,
          redirectUrl
        );
      }

      const newId = uuidv4();
      const hashedPassword = await bcrypt.hash(uuidv4(), 10);
      await authRepository.createSocialSignupUser({
        id: newId,
        name,
        email,
        hashedPassword,
        role,
      });

      if (role === "Administrator" || role === "Super_Admin") {
        await authRepository.insertAdministratorRole(newId, role);
      } else if (role === "Member") {
        await authRepository.insertMemberForUser(newId);
      }

      await socialAuthRepository.insert(newId, "google", providerId);

      dbUser = await authRepository.findById(newId);
      if (!dbUser) {
        return redirectWithError(
          "creation_failed",
          "Failed to create user account",
          res,
          type,
          redirectUrl
        );
      }
      return proceedWithUser(dbUser, redirectUrl, res);
    }

    return redirectWithError(
      "invalid_type",
      "Invalid authentication type. Must be 'signin' or 'signup'",
      res,
      type,
      redirectUrl
    );
  } catch (e) {
    console.error("Callback crash:", e);
    let errorType = "signin";
    if (req.query.state) {
      try {
        const parsed = JSON.parse(req.query.state);
        errorType = parsed.type || "signin";
      } catch {
        /* ignore */
      }
    }
    return redirectWithError(
      "server_error",
      "Internal server error during authentication",
      res,
      errorType,
      redirectUrl
    );
  }
}

module.exports = {
  redirectWithError,
  proceedWithUser,
  handleGoogleOAuthCallback,
};
