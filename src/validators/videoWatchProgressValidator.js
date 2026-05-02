exports.requireUserId = (userId) => {
  if (!userId) {
    const e = new Error("Unauthorized: user not found");
    e.status = 401;
    throw e;
  }
};

/**
 * Returns normalized { progress_seconds?, completed? } from raw body.
 */
exports.parseUpsertBody = (body) => {
  const { progress_seconds: psRaw, completed: compRaw } = body || {};
  if (psRaw === undefined && compRaw === undefined) {
    const e = new Error("Provide progress_seconds and/or completed");
    e.status = 400;
    throw e;
  }

  let progress_seconds;
  if (psRaw !== undefined && psRaw !== null) {
    progress_seconds = Math.trunc(Number(psRaw));
    if (!Number.isFinite(progress_seconds) || progress_seconds < 0) {
      const e = new Error("progress_seconds must be a non-negative integer");
      e.status = 400;
      throw e;
    }
  }

  let completed;
  if (compRaw !== undefined) {
    completed = Boolean(compRaw);
  }

  return { progress_seconds, completed };
};
