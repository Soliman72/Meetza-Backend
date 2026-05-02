exports.redirectWithError = (res, redirect, msg) => {
    return res.redirect(`${redirect}?error=${encodeURIComponent(msg)}`);
  };