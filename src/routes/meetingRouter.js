const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meetingController");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Manage meetings within groups
 */

/**
 * @swagger
 * /api/meeting:
 *   get:
 *     summary: Get all meetings (admin)
 *     description: Returns all meetings. For non‑super admins, the results are filtered by ownership.
 *     tags: [Meetings]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter meetings by title (partial match).
 *     responses:
 *       200:
 *         description: List of meetings.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", verifyToken, meetingController.getAllMeetings);

/**
 * @swagger
 * /api/meeting:
 *   post:
 *     summary: Create a new meeting
 *     description: >
 *       Create a meeting for a specific group. Only the group's admin or a super admin
 *       can create meetings. This endpoint accepts multipart/form-data for poster and files.
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               group_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Completed, Cancelled]
 *               description:
 *                 type: string
 *               weekly:
 *                 type: string
 *                 description: If true or 1, creates a weekly recurring series (status must be Scheduled). Same weekday and time as start_time.
 *                 enum: ["true", "false", "1", "0"]
 *               poster_file:
 *                 type: string
 *                 format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - title
 *               - start_time
 *               - end_time
 *               - group_id
 *               - status
 *     responses:
 *       201:
 *         description: Meeting created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       409:
 *         description: Overlapping meeting for the same group.
 */
router.post("/", verifyToken, checkAdminPermission, meetingController.createMeeting);

/**
 * @swagger
 * /api/meeting/{id}/deactivate-recurrence:
 *   patch:
 *     summary: Stop weekly recurrence for a meeting's series
 *     description: >
 *       Deactivates the cron job and updates the is_weekly status to 0 for all current meetings belonging to the series.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Recurrence stopped.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting or Series not found.
 */
router.patch("/:id/deactivate-recurrence", verifyToken, checkAdminPermission, meetingController.deactivateMeetingRecurrence);

/**
 * @swagger
 * /api/meeting/{id}/activate-recurrence:
 *   post:
 *     summary: Start weekly recurrence for a specific meeting or series
 *     description: >
 *       Activates the cron job. If the ID is a meeting ID and the meeting is not already part of a series, it creates a new series. If the ID is a series ID, it restarts that series.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID or Series ID
 *     responses:
 *       200:
 *         description: Recurrence started.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting or Series not found.
 */
router.post("/:id/activate-recurrence", verifyToken, checkAdminPermission, meetingController.activateMeetingRecurrence);

/**
 * @swagger
 * /api/meeting/group/{group_id}:
 *   get:
 *     summary: Get meetings for a group
 *     description: Returns all meetings for the specified group that the user has access to.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group.
 *     responses:
 *       200:
 *         description: List of group meetings.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */

/**
 * @swagger
 * /api/meeting/{id}:
 *   get:
 *     summary: Get meeting by ID
 *     description: Get details of a single meeting. Accessible by meeting admin, group members, or super admin.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID.
 *     responses:
 *       200:
 *         description: Meeting details.
 *       400:
 *         description: Missing or invalid ID.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting not found.
 */
router.get("/:id", verifyToken, meetingController.getMeetingById);

/**
 * @swagger
 * /api/meeting/{id}:
 *   put:
 *     summary: Update a meeting
 *     description: Update meeting details. Only admins with permission can update.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update (see meeting model).
 *     responses:
 *       200:
 *         description: Meeting updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting not found.
 */
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  uploadMiddleware,
  meetingController.updateMeetingById
);

/**
 * @swagger
 * /api/meeting/{id}:
 *   delete:
 *     summary: Delete a meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID.
 *       - in: query
 *         name: scope
 *         required: false
 *         schema:
 *           type: string
 *           enum: [single, series]
 *           default: single
 *         description: >
 *           single = delete only this meeting occurrence (this week).
 *           series = delete the entire weekly series forever (stops recurrence, deletes all occurrences).
 *     responses:
 *       200:
 *         description: Meeting deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting not found.
 */
router.delete("/:id", verifyToken, checkAdminPermission, meetingController.deleteMeetingById);

/**
 * @swagger
 * /api/meeting/{id}/join:
 *   post:
 *     summary: Join a meeting
 *     description: Allows a group member to join a meeting.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID.
 *     responses:
 *       200:
 *         description: Joined meeting successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting not found.
 */
router.post("/:id/join", verifyToken, meetingController.joinMeeting);

/**
 * @swagger
 * /api/meeting/{id}/leave:
 *   post:
 *     summary: Leave a meeting
 *     description: Allows a group member to leave a meeting.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID.
 *     responses:
 *       200:
 *         description: Left meeting successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting not found.
 */
router.post("/:id/leave", verifyToken, meetingController.leaveMeeting);

/**
 * @swagger
 * /api/meeting/{id}/participants:
 *   get:
 *     summary: Get meeting participants
 *     description: Returns the list of participants for a meeting.
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID.
 *     responses:
 *       200:
 *         description: List of participants.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Meeting not found.
 */
router.get("/:id/participants", verifyToken, meetingController.getMeetingParticipants);


module.exports = router;
