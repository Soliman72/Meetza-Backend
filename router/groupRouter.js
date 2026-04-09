const express = require("express");
const router = express.Router();
const groupController = require("../controller/groupController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Manage student groups
 */

/**
 * @swagger
 * /api/group:
 *   get:
 *     summary: Get all groups
 *     description: >
 *       Returns all groups, including administrator information. Results may be
 *       filtered by name, year, and semester. For regular admins, results are filtered
 *       by ownership.
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by group name (partial match).
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: >
 *           One or more years, comma-separated (e.g. "1,2,3") or repeated query
 *           parameters. Valid values are 1, 2, 3, 4.
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: >
 *           One or more semesters, comma-separated (e.g. "Fall,Spring") or repeated query
 *           parameters. Valid values are Fall, Spring, Summer.
 *     responses:
 *       200:
 *         description: List of groups.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", verifyToken, groupController.getAllGroups);

/**
 * @swagger
 * /api/group:
 *   post:
 *     summary: Create a new group
 *     description: >
 *       Create a group with basic info and optional group photo. Also creates an initial
 *       group content record. Requires admin permission.
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *               position_id:
 *                 type: string
 *               description:
 *                 type: string
 *               year:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *               semester:
 *                 type: string
 *                 enum: [Fall, Spring, Summer]
 *               group_content_name:
 *                 type: string
 *               group_content_description:
 *                 type: string
 *               group_photo:
 *                 type: string
 *                 format: binary
 *             required:
 *               - group_name
 *               - position_id
 *               - year
 *               - semester
 *               - group_content_name
 *     responses:
 *       201:
 *         description: Group created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Related resource not found.
 */
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  groupController.createGroup,
);

/**
 * @swagger
 * /api/group/{id}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID.
 *     responses:
 *       200:
 *         description: Group details.
 *       400:
 *         description: Missing or invalid ID.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Group not found.
 */
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupController.getGroupById,
);

/**
 * @swagger
 * /api/group/{id}:
 *   put:
 *     summary: Update a group
 *     description: Update group information and/or group photo. Requires admin permission.
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *               position_id:
 *                 type: string
 *               description:
 *                 type: string
 *               year:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *               semester:
 *                 type: string
 *                 enum: [Fall, Spring, Summer]
 *               group_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Group updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Group not found.
 */
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupController.updateGroup,
);

/**
 * @swagger
 * /api/group/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID.
 *     responses:
 *       200:
 *         description: Group deleted successfully.
 *       400:
 *         description: Missing or invalid ID.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupController.deleteGroup,
);

router.get(
  "/:id/admins",
  verifyToken,
  checkAdminPermission,
  groupController.getGroupAdmins,
);

router.post(
  "/:id/admins",
  verifyToken,
  checkAdminPermission,
  groupController.addGroupAdmin,
);

router.delete(
  "/:id/admins/:email",
  verifyToken,
  checkAdminPermission,
  groupController.removeGroupAdmin,
);

module.exports = router;
