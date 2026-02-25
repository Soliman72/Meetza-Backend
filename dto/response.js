/**
 * Standard API response DTOs.
 * Use these so all endpoints return a consistent shape: { success, message?, data?, error? }
 */

/**
 * Success response
 * @param {*} data - payload (object or array)
 * @param {string} [message] - optional message
 * @returns {{ success: true, message?: string, data?: * }}
 */
const success = (data = null, message = null) => {
  const body = { success: true };
  if (message != null) body.message = message;
  if (data != null) body.data = data;
  return body;
};

/**
 * Error response
 * @param {string} message - error message
 * @param {{ statusCode?: number, error?: string }} [opts]
 * @returns {{ success: false, message: string, error?: string }}
 */
const error = (message, opts = {}) => {
  const body = { success: false, message };
  if (opts.error != null) body.error = opts.error;
  return body;
};

/**
 * Paginated list response
 * @param {Array} items - list of items
 * @param {number} total - total count
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @param {string} [message]
 */
const paginated = (items, total, page = 1, limit = 10, message = null) => {
  const body = {
    success: true,
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
  if (message != null) body.message = message;
  return body;
};

module.exports = {
  success,
  error,
  paginated,
};
