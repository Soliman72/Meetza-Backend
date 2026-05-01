jest.mock("../../../src/services/commentService", () => ({
  createComment: jest.fn(),
  getCommentsByVideoId: jest.fn(),
  getCommentById: jest.fn(),
  getCommentsByUserId: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}));
jest.mock("../../../src/validators/commentValidator", () => ({
  validateAuthenticatedUser: jest.fn(),
}));
jest.mock("../../../src/services/likeService", () => ({
  createLike: jest.fn(),
  getLikesByVideoId: jest.fn(),
  getLikesByUserId: jest.fn(),
  updateLike: jest.fn(),
  deleteLike: jest.fn(),
}));
jest.mock("../../../src/validators/likeValidator", () => ({
  validateAuthenticatedUser: jest.fn(),
}));
jest.mock("../../../src/services/memberService", () => ({
  createMember: jest.fn(),
  getAllMembers: jest.fn(),
  getMemberById: jest.fn(),
  updateMember: jest.fn(),
  deleteMember: jest.fn(),
}));
jest.mock("../../../src/services/saved_videoService", () => ({
  createSavedVideo: jest.fn(),
  getSavedVideosByUserId: jest.fn(),
  getSavedVideoById: jest.fn(),
  getAllSavedVideos: jest.fn(),
  deleteSavedVideo: jest.fn(),
}));
jest.mock("../../../src/services/videoWatchProgressService", () => ({
  listByUser: jest.fn(),
  getWatchProgressForRequest: jest.fn(),
  upsertWatchProgressForRequest: jest.fn(),
  deleteWatchProgressForRequest: jest.fn(),
}));

const commentService = require("../../../src/services/commentService");
const commentValidator = require("../../../src/validators/commentValidator");
const likeService = require("../../../src/services/likeService");
const likeValidator = require("../../../src/validators/likeValidator");
const memberService = require("../../../src/services/memberService");
const savedVideoService = require("../../../src/services/saved_videoService");
const videoWatchProgressService = require("../../../src/services/videoWatchProgressService");

const commentController = require("../../../src/controllers/commentController");
const likeController = require("../../../src/controllers/likeController");
const memberController = require("../../../src/controllers/memberController");
const savedVideoController = require("../../../src/controllers/saved_videoController");
const videoWatchProgressController = require("../../../src/controllers/videoWatchProgressController");

const resMock = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("engagement controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("commentController covers success and error paths", async () => {
    let req = {};
    let res = resMock();
    commentService.createComment.mockResolvedValue({ status: 201, body: { ok: true } });
    await commentController.createComment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = resMock();
    commentService.createComment.mockRejectedValue({ status: 500, message: "db" });
    await commentController.createComment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    req = { params: { video_id: "3" } };
    res = resMock();
    commentService.getCommentsByVideoId.mockResolvedValue({ commentCount: 1, comments: [] });
    await commentController.getCommentsByVideoId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    commentService.getCommentsByVideoId.mockRejectedValue({ status: 404, message: "nf" });
    await commentController.getCommentsByVideoId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    req = { params: { id: "1" } };
    res = resMock();
    commentService.getCommentById.mockResolvedValue({ id: 1 });
    await commentController.getCommentById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    commentService.getCommentById.mockRejectedValue(new Error("db"));
    await commentController.getCommentById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    req = { user: { id: 7 } };
    res = resMock();
    commentService.getCommentsByUserId.mockResolvedValue([]);
    await commentController.getCommentsByUserId(req, res);
    expect(commentValidator.validateAuthenticatedUser).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    commentValidator.validateAuthenticatedUser.mockImplementation(() => {
      throw { status: 401, message: "unauthorized" };
    });
    await commentController.getCommentsByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    commentValidator.validateAuthenticatedUser.mockReset();

    req = { params: { id: "1" }, body: { comment_text: "x" } };
    res = resMock();
    commentService.updateComment.mockResolvedValue({ id: 1 });
    await commentController.updateComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    commentService.updateComment.mockRejectedValue({ status: 400, message: "bad" });
    await commentController.updateComment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    req = { params: { id: "1" } };
    res = resMock();
    commentService.deleteComment.mockResolvedValue();
    await commentController.deleteComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    commentService.deleteComment.mockRejectedValue(new Error("db"));
    await commentController.deleteComment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("likeController covers success and error paths", async () => {
    let req = {};
    let res = resMock();
    likeService.createLike.mockResolvedValue({ status: 201, body: { ok: true } });
    await likeController.createLike(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = resMock();
    likeService.createLike.mockRejectedValue(new Error("db"));
    await likeController.createLike(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    req = { params: { video_id: "9" } };
    res = resMock();
    likeService.getLikesByVideoId.mockResolvedValue({ likeCounts: 2, data: [] });
    await likeController.getLikesByVideoId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    likeService.getLikesByVideoId.mockRejectedValue({ status: 404, message: "nf" });
    await likeController.getLikesByVideoId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    req = { user: { id: 7 } };
    res = resMock();
    likeService.getLikesByUserId.mockResolvedValue([]);
    await likeController.getLikesByUserId(req, res);
    expect(likeValidator.validateAuthenticatedUser).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(200);

    req = {};
    res = resMock();
    likeValidator.validateAuthenticatedUser.mockImplementation(() => {
      throw { status: 401, message: "unauthorized" };
    });
    await likeController.getLikesByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    likeValidator.validateAuthenticatedUser.mockReset();

    req = {};
    res = resMock();
    likeService.updateLike.mockResolvedValue({ message: "updated" });
    await likeController.updateLike(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    likeService.updateLike.mockRejectedValue({ status: 400, message: "bad" });
    await likeController.updateLike(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    req = { user: { id: 1 }, params: { video_id: "3" } };
    res = resMock();
    likeService.deleteLike.mockResolvedValue({ message: "deleted" });
    await likeController.deleteLike(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    req = {};
    res = resMock();
    likeValidator.validateAuthenticatedUser.mockImplementation(() => {
      throw { status: 401, message: "unauthorized" };
    });
    await likeController.deleteLike(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    likeValidator.validateAuthenticatedUser.mockReset();
  });

  test("memberController covers service wrapper branches", async () => {
    const req = {};
    memberService.createMember.mockResolvedValue({ id: 1 });
    await expect(memberController.createMember(req)).resolves.toEqual({ id: 1 });

    let res = resMock();
    memberService.getAllMembers.mockResolvedValue([]);
    await memberController.getAllMembers({}, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    memberService.getAllMembers.mockRejectedValue(new Error("db"));
    await memberController.getAllMembers({}, res);
    expect(res.status).toHaveBeenCalledWith(500);

    res = resMock();
    memberService.getMemberById.mockResolvedValue({ id: 1 });
    await memberController.getMemberById({ params: { id: "1" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    memberService.getMemberById.mockRejectedValue({ status: 404, message: "nf" });
    await memberController.getMemberById({ params: { id: "1" } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    res = resMock();
    memberService.updateMember.mockResolvedValue();
    await memberController.updateMember(
      { params: { id: "1" }, body: { user_id: "2" } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    memberService.updateMember.mockRejectedValue({ status: 400, message: "bad" });
    await memberController.updateMember(
      { params: { id: "1" }, body: { user_id: "2" } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);

    res = resMock();
    memberService.deleteMember.mockResolvedValue();
    await memberController.deleteMember({ params: { id: "1" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    memberService.deleteMember.mockRejectedValue({ status: 400, message: "bad" });
    await memberController.deleteMember({ params: { id: "1" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("saved_videoController covers success and error paths", async () => {
    let req = {};
    let res = resMock();
    savedVideoService.createSavedVideo.mockResolvedValue({ id: 1 });
    await savedVideoController.createSavedVideo(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = resMock();
    savedVideoService.createSavedVideo.mockRejectedValue(new Error("db"));
    await savedVideoController.createSavedVideo(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    res = resMock();
    savedVideoService.getSavedVideosByUserId.mockResolvedValue([]);
    await savedVideoController.getSavedVideosByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    savedVideoService.getSavedVideosByUserId.mockRejectedValue({ status: 401, message: "u" });
    await savedVideoController.getSavedVideosByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(401);

    res = resMock();
    savedVideoService.getSavedVideoById.mockResolvedValue({ id: 1 });
    await savedVideoController.getSavedVideoById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    savedVideoService.getSavedVideoById.mockRejectedValue(new Error("db"));
    await savedVideoController.getSavedVideoById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    res = resMock();
    savedVideoService.getAllSavedVideos.mockResolvedValue([]);
    await savedVideoController.getAllSavedVideos(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    savedVideoService.getAllSavedVideos.mockRejectedValue({ status: 400, message: "bad" });
    await savedVideoController.getAllSavedVideos(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    req = { user: { id: 1 }, params: { video_id: "3" } };
    res = resMock();
    savedVideoService.deleteSavedVideo.mockResolvedValue({ ok: true });
    await savedVideoController.deleteSavedVideo(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    savedVideoService.deleteSavedVideo.mockRejectedValue(new Error("db"));
    await savedVideoController.deleteSavedVideo(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("videoWatchProgressController covers success and error paths", async () => {
    let req = { query: { limit: "10", offset: "0" } };
    let res = resMock();
    videoWatchProgressService.listByUser.mockResolvedValue([]);
    await videoWatchProgressController.listMyWatchProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    videoWatchProgressService.listByUser.mockRejectedValue({ status: 400, message: "bad" });
    await videoWatchProgressController.listMyWatchProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    req = { params: { id: "1" } };
    res = resMock();
    videoWatchProgressService.getWatchProgressForRequest.mockResolvedValue({ id: 1 });
    await videoWatchProgressController.getWatchProgressByVideoId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    videoWatchProgressService.getWatchProgressForRequest.mockRejectedValue(
      new Error("db")
    );
    await videoWatchProgressController.getWatchProgressByVideoId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    res = resMock();
    videoWatchProgressService.upsertWatchProgressForRequest.mockResolvedValue({ id: 1 });
    await videoWatchProgressController.upsertWatchProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    videoWatchProgressService.upsertWatchProgressForRequest.mockRejectedValue({
      status: 422,
      message: "invalid",
    });
    await videoWatchProgressController.upsertWatchProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(422);

    res = resMock();
    videoWatchProgressService.deleteWatchProgressForRequest.mockResolvedValue();
    await videoWatchProgressController.deleteWatchProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = resMock();
    videoWatchProgressService.deleteWatchProgressForRequest.mockRejectedValue(
      new Error("db")
    );
    await videoWatchProgressController.deleteWatchProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
