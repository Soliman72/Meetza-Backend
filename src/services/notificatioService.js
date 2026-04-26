const repo = require("../repositories/notificationRepository");
const notificationPendingGroupActionRepo = require("../repositories/notificationPendingGroupActionRepository");
const { buildNotification } = require("./notificationBuilder");
const emitter = require("../sockets/notificationSocket");
const notificationValidator = require("../validators/notificationValidator");
const userRepository = require("../repositories/userRepository");
const sendEmail = require("../utils/sendEmail");

const getMemberNotifications = async (memberId) => {
  return await repo.getByMemberId(memberId);
};

const getUnreadCount = async (memberId) => {
  return await repo.countUnread(memberId);
};

const markAsRead = async (id, memberId) => {
  const ok = await repo.markAsRead(id, memberId);

  if (ok) {
    const count = await repo.countUnread(memberId);
    emitter.emitUnreadCount(memberId, count);
  }

  return ok;
};

const markAllAsRead = async (memberId) => {
  await repo.markAllAsRead(memberId);
  emitter.emitUnreadCount(memberId, 0);
};

const deleteNotification = async (id, memberId) => {
  const ok = await repo.remove(id, memberId);

  if (ok) {
    const count = await repo.countUnread(memberId);
    emitter.emitUnreadCount(memberId, count);
  }

  return ok;
};

const buildEmailActionButtons = ({ approveUrl, rejectUrl }) => `
                      <div style="text-align:center;margin:28px 0 8px;">
                        <a href="${approveUrl}"
                          style="display:inline-block;padding:14px 28px;margin:6px;background:#0f172a;color:#ffffff;
                          text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">
                          Approve
                        </a>
                        <a href="${rejectUrl}"
                          style="display:inline-block;padding:14px 28px;margin:6px;background:#ffffff;color:#0f172a;
                          text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;border:2px solid #0f172a;">
                          Reject
                        </a>
                      </div>
                      <p style="margin:0 auto 8px;color:#64748b;font-size:13px;line-height:1.6;text-align:center;max-width:520px;">
                        Or open Meetza and go to pending groups to review this request.
                      </p>`;

const createNotification = async ({
  senderId,
  memberId,
  title,
  message,
  type,
  pendingGroupApproval,
  emailActions,
  emailHeaderTagline,
  skipEmail,
  emailOptional,
}) => {
  const notification = buildNotification({
    senderId,
    memberId,
    title,
    message,
    type,
  });

  await notificationValidator.createNotificationValidator(notification);

  await repo.create(notification);

  if (
    pendingGroupApproval?.pendingGroupId &&
    pendingGroupApproval?.approveUrl &&
    pendingGroupApproval?.rejectUrl
  ) {
    await notificationPendingGroupActionRepo.create({
      notificationId: notification.id,
      pendingGroupId: pendingGroupApproval.pendingGroupId,
      approveUrl: pendingGroupApproval.approveUrl,
      rejectUrl: pendingGroupApproval.rejectUrl,
    });
    notification.pending_group_approval = {
      pending_group_id: pendingGroupApproval.pendingGroupId,
      approve_url: pendingGroupApproval.approveUrl,
      reject_url: pendingGroupApproval.rejectUrl,
    };
  }

  const count = await repo.countUnread(memberId);

  emitter.emitNotification(notification);
  emitter.emitUnreadCount(memberId, count);

  if (skipEmail) {
    return notification;
  }

  let senderName = "Someone";
  if (senderId) {
    const sender = await userRepository.findById(senderId);
    if (sender?.name) senderName = sender.name;
  }

  const headerTagline = emailHeaderTagline || "New Group Content";
  const actionBlock =
    emailActions?.approveUrl && emailActions?.rejectUrl
      ? buildEmailActionButtons({
          approveUrl: emailActions.approveUrl,
          rejectUrl: emailActions.rejectUrl,
        })
      : "";

  const messageMail =
      message +
      `\nOpen Meetza to check the latest update and stay up to date with your group activity!`;
    const emailTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Meetza Notification</title>
        </head>

        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Verdana,sans-serif;background:#f2f4f7;">

          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f2f4f7;">
            <tr>
              <td style="padding:48px 16px;">

                <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;
                    border-radius:20px;box-shadow:0 20px 60px rgba(15,23,42,0.12);overflow:hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                      <table role="presentation" style="margin:0 auto;border-collapse:collapse;">
                        <tr>
                          <td style="padding-right:10px;">
                            <img src="https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_kd3j3a.png"
                              alt="Meetza Icon" style="max-width:48px;height:auto;display:block;" />
                          </td>
                          <td style="padding-left:10px;">
                            <img src="https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_name_dqrdvl.png"
                              alt="Meetza" style="max-width:150px;height:auto;display:block;" />
                          </td>
                        </tr>
                      </table>
                      <p style="margin:10px 0 0;color:#64748b;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                        ${headerTagline}
                      </p>
                    </td>
                  </tr>

                  <!-- Message Content -->
                  <tr>
                    <td style="padding:40px 42px 38px;">

                      <h2 style="margin:0 0 14px;text-align:center;color:#0f172a;font-size:22px;font-weight:600;">
                        New Update from ${senderName}
                      </h2>

                      <p style="margin:0 auto;color:#4a5568;font-size:15px;line-height:1.7;text-align:center;max-width:520px;">
                        ${messageMail.replace(/\n/g, "<br/>")}
                      </p>

                      ${actionBlock}

                      <!-- Highlight Box -->
                      <div style="margin:32px auto 24px;background:#f8fafc;border-left:4px solid #0f172a;
                                  padding:20px 22px;border-radius:12px;max-width:520px;">
                        <p style="margin:0;color:#1f2a37;font-size:14px;line-height:1.7;">
                          This notification indicates that new data or content has been added to your group on Meetza.
                        </p>
                      </div>

                      <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.7;
                                border-top:1px solid #e2e8f0;padding-top:20px;">
                        If you believe this notification was not intended for you, feel free to ignore it.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:26px 24px;text-align:center;border-top:1px solid #e5eaf3;">
                      <p style="margin:0 0 6px;color:#475569;font-size:12px;">
                        © ${new Date().getFullYear()} Meetza. All rights reserved.
                      </p>
                      <p style="margin:0;color:#94a3b8;font-size:11px;">
                        This is an automated message, please do not reply.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>`;

  const member = await userRepository.getEmailById(memberId);
  if (member?.email) {
    try {
      await sendEmail({
        to: member.email,
        subject: "New Update from " + senderName,
        html: emailTemplate,
      });
    } catch (error) {
      throw error;
    }
  } else if (!emailOptional) {
    throw new Error("Member email not found");
  }

  return notification;
};

const handleCommentNotifications = async ({
  user_id,
  video,
  parent,
  commenter,
  video_owner,
}) => {
  const ownerRecipientId =
    video_owner?.user_id ?? video_owner?.id ?? null;
  const parentOwnerId = parent
    ? parent.user_id ?? parent.member_id
    : null;

  if (parent?.id) {
    if (parentOwnerId && parentOwnerId !== user_id) {
      await createNotification({
        senderId: user_id,
        memberId: parentOwnerId,
        title: "Reply to your comment",
        message: `${commenter.name} replied to your comment on the video "${video.title}".`,
      });
    }
    if (
      ownerRecipientId &&
      ownerRecipientId !== user_id &&
      ownerRecipientId !== parentOwnerId
    ) {
      await createNotification({
        senderId: user_id,
        memberId: ownerRecipientId,
        title: "New reply on your video",
        message: `${commenter.name} replied to a comment on your video "${video.title}".`,
      });
    }
  } else if (ownerRecipientId && ownerRecipientId !== user_id) {
    await createNotification({
      senderId: user_id,
      memberId: ownerRecipientId,
      title: "New comment on your video",
      message: `${commenter.name} commented on your video "${video.title}".`,
    });
  }
};

module.exports = {
  getMemberNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  handleCommentNotifications,
};