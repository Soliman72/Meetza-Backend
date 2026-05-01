jest.mock("../../../src/utils/videoWatchProgressFields", () => ({
  mapWatchProgressFromRow: jest.fn(),
}));
jest.mock("../../../src/utils/normalizeTopicsVideo", () => ({
  normalizeTopics: jest.fn((value) => `normalized:${value ?? ""}`),
}));

const {
  respondGroupAccessOrServerError,
} = require("../../../src/services/groupAccessHttpService");
const { GroupAccessError } = require("../../../src/utils/groupAccess");
const { buildNotification } = require("../../../src/services/notificationBuilder");
const {
  getRequestedLocalization,
  buildVideoSearchCondition,
  mapSavedVideoRow,
} = require("../../../src/services/videoSearchService");
const chatSocketService = require("../../../src/services/chatSocketService");
const {
  mapWatchProgressFromRow,
} = require("../../../src/utils/videoWatchProgressFields");
const { normalizeTopics } = require("../../../src/utils/normalizeTopicsVideo");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("service helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("respondGroupAccessOrServerError handles GroupAccessError", () => {
    const res = makeRes();
    respondGroupAccessOrServerError(res, new GroupAccessError("denied", 403));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "denied",
    });
  });

  test("respondGroupAccessOrServerError handles explicit status and fallback", () => {
    let res = makeRes();
    respondGroupAccessOrServerError(res, { status: 422, message: "invalid" });
    expect(res.status).toHaveBeenCalledWith(422);

    res = makeRes();
    respondGroupAccessOrServerError(res, new Error("boom"));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "boom",
    });
  });

  test("buildNotification creates normalized payload", () => {
    const payload = buildNotification({
      senderId: "s1",
      memberId: "m1",
      title: "Hello",
      message: "World",
    });

    expect(payload).toEqual(
      expect.objectContaining({
        senderId: "s1",
        memberId: "m1",
        title: "Hello",
        message: "World",
        type: "GENERAL",
      })
    );
    expect(typeof payload.id).toBe("string");
  });

  test("getRequestedLocalization resolves header and defaults to ar", () => {
    const reqEn = { header: jest.fn().mockReturnValue(" EN ") };
    const reqBad = { header: jest.fn().mockReturnValue("de") };
    const reqMissing = { header: jest.fn().mockReturnValue(undefined) };

    expect(getRequestedLocalization(reqEn)).toBe("en");
    expect(getRequestedLocalization(reqBad)).toBe("ar");
    expect(getRequestedLocalization(reqMissing)).toBe("ar");
  });

  test("buildVideoSearchCondition returns empty and populated clauses", () => {
    expect(buildVideoSearchCondition("")).toEqual({ clause: "", params: [] });

    const result = buildVideoSearchCondition("meeting", "vv");
    expect(result.clause).toContain("vv.title LIKE ?");
    expect(result.params).toEqual(["%meeting%", "%meeting%", "%meeting%"]);
  });

  test("mapSavedVideoRow maps topics and optional watch progress", () => {
    mapWatchProgressFromRow.mockReturnValue({ seconds: 120 });
    const row = {
      id: "v1",
      topics_ar: "arabic",
      topics_en: "english",
      watch_progress_seconds: 1,
      watch_completed: 0,
      watch_status: "started",
      watch_progress_percentage: 5,
    };

    const withWatch = mapSavedVideoRow(row, true);
    expect(withWatch).toEqual(
      expect.objectContaining({
        id: "v1",
        topics: { ar: "normalized:arabic", en: "normalized:english" },
        watch_progress: { seconds: 120 },
      })
    );
    expect(mapWatchProgressFromRow).toHaveBeenCalledWith(row);
    expect(normalizeTopics).toHaveBeenCalledTimes(2);

    const withoutWatch = mapSavedVideoRow(row, false);
    expect(withoutWatch.watch_progress).toBeNull();
  });

  test("chatSocketService registers and broadcasts to group room", () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const io = { to };

    chatSocketService.registerChatIo(io);
    expect(chatSocketService.getChatIo()).toBe(io);

    chatSocketService.broadcastMessage({ group_id: "g1", text: "hello" });
    expect(to).toHaveBeenCalledWith("group:g1");
    expect(emit).toHaveBeenCalledWith("message", { group_id: "g1", text: "hello" });

    chatSocketService.broadcastMessage(null);
    expect(to).toHaveBeenCalledTimes(1);
  });
});
