jest.mock("axios", () => ({
  post: jest.fn(),
}));
jest.mock("../../../src/repositories/groupRepository", () => ({
  getAdminsByGroupIds: jest.fn(),
  getUserRole: jest.fn(),
  getGroupAsSuperAdmin: jest.fn(),
  getGroupWithAccess: jest.fn(),
  getGroupMedia: jest.fn(),
  getGroupAdmins: jest.fn(),
}));
jest.mock("../../../src/utils/videoWatchProgressFields", () => ({
  mapWatchProgressFromRow: jest.fn(),
}));
jest.mock("../../../src/utils/normalizeTopicsVideo", () => ({
  normalizeTopics: jest.fn((v) => `norm:${v ?? ""}`),
}));
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));
jest.mock("../../../src/repositories/userRepository", () => ({
  findById: jest.fn(),
}));
jest.mock("../../../src/repositories/companyRepository", () => ({
  findCompanyById: jest.fn(),
  companySettingsExists: jest.fn(),
}));

const axios = require("axios");
const groupRepo = require("../../../src/repositories/groupRepository");
const { mapWatchProgressFromRow } = require("../../../src/utils/videoWatchProgressFields");
const { normalizeTopics } = require("../../../src/utils/normalizeTopicsVideo");
const jwt = require("jsonwebtoken");
const userRepository = require("../../../src/repositories/userRepository");
const companyRepository = require("../../../src/repositories/companyRepository");

const { mapSavedVideoRow } = require("../../../src/utils/mapSavedVideo");
const { attachAdminsToGroups } = require("../../../src/utils/attachAdmin");
const { verifyCaptcha } = require("../../../src/utils/captcha");
const {
  normalizeLimit,
  normalizeBefore,
  normalizeMessage,
  normalizeEmoji,
} = require("../../../src/utils/chatMessageNormalize");
const {
  ensureGroupAcsses,
  GroupAccessError,
} = require("../../../src/utils/ensureGroupAcsses");
const {
  getJwtVerifyOptions,
  getBearerTokenFromRequest,
  loadUserFromAccessToken,
} = require("../../../src/utils/authJwtUser");
const companyUtils = require("../../../src/utils/companyUtils");

describe("core utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("mapSavedVideoRow maps topics and optional watch progress", () => {
    const row = {
      id: "s1",
      topics_ar: "ar",
      topics_en: "en",
      watch_progress_seconds: 10,
      watch_completed: 0,
      watch_status: "watching",
      watch_progress_percentage: 10,
    };
    mapWatchProgressFromRow.mockReturnValue({ seconds: 10 });

    const withWatch = mapSavedVideoRow(row, true);
    expect(withWatch).toEqual(
      expect.objectContaining({
        id: "s1",
        topics: { ar: "norm:ar", en: "norm:en" },
        watch_progress: { seconds: 10 },
      })
    );
    const withoutWatch = mapSavedVideoRow(row, false);
    expect(withoutWatch.watch_progress).toBeNull();
    expect(normalizeTopics).toHaveBeenCalledTimes(4);
  });

  test("attachAdminsToGroups handles empty and grouped admins", async () => {
    await expect(attachAdminsToGroups([])).resolves.toEqual([]);
    const groups = [{ id: "g1" }, { id: "g2" }];
    groupRepo.getAdminsByGroupIds.mockResolvedValue([
      { group_id: "g1", name: "A" },
      { group_id: "g1", name: "B" },
    ]);
    const out = await attachAdminsToGroups(groups);
    expect(out).toEqual([
      { id: "g1", admins: [{ group_id: "g1", name: "A" }, { group_id: "g1", name: "B" }] },
      { id: "g2", admins: [] },
    ]);
  });

  test("verifyCaptcha covers success and failure modes", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, score: 0.9 } });
    await expect(verifyCaptcha("tok")).resolves.toBe(true);

    axios.post.mockResolvedValueOnce({ data: { success: false } });
    await expect(verifyCaptcha("tok")).rejects.toThrow("CAPTCHA verification failed");

    axios.post.mockResolvedValueOnce({ data: { success: true, score: 0.1 } });
    await expect(verifyCaptcha("tok")).rejects.toThrow("Low CAPTCHA score");
  });

  test("chatMessageNormalize validates and normalizes fields", () => {
    expect(normalizeLimit("3")).toBe(3);
    expect(normalizeLimit("0")).toBe(50);
    expect(normalizeLimit("999", 50, 200)).toBe(200);

    expect(normalizeBefore("2026-01-01T00:00:00.000Z")).toBeInstanceOf(Date);
    expect(() => normalizeBefore("not-date")).toThrow("Invalid 'before' timestamp");
    expect(normalizeBefore("")).toBeUndefined();

    expect(normalizeMessage(" hello ")).toBe("hello");
    expect(() => normalizeMessage("")).toThrow("Message is required");
    expect(normalizeMessage("", { allowEmpty: true })).toBe("");

    expect(normalizeEmoji("  :) ")).toBe(":)");
    expect(() => normalizeEmoji("")).toThrow("Emoji is required");
  });

  test("ensureGroupAcsses handles roles and access errors", async () => {
    groupRepo.getUserRole.mockResolvedValueOnce("Super_Admin");
    groupRepo.getGroupAsSuperAdmin.mockResolvedValueOnce({ id: "g1" });
    groupRepo.getGroupMedia.mockResolvedValueOnce([{ m: 1 }]);
    groupRepo.getGroupAdmins.mockResolvedValueOnce([{ a: 1 }]);
    await expect(ensureGroupAcsses("u1", "g1")).resolves.toEqual({
      id: "g1",
      group_media: [{ m: 1 }],
      admins: [{ a: 1 }],
    });

    groupRepo.getUserRole.mockResolvedValueOnce("Member");
    groupRepo.getGroupWithAccess.mockResolvedValueOnce(null);
    await expect(ensureGroupAcsses("u2", "g1")).rejects.toBeInstanceOf(GroupAccessError);

    groupRepo.getUserRole.mockResolvedValueOnce("Member");
    groupRepo.getGroupWithAccess.mockResolvedValueOnce({ id: "g1", membership_role: null });
    await expect(ensureGroupAcsses("u2", "g1")).rejects.toMatchObject({ statusCode: 403 });
  });

  test("authJwtUser parses bearer token and loads user", async () => {
    process.env.JWT_CLOCK_TOLERANCE = "60";
    process.env.JWT_SECRET = "secret";
    expect(getJwtVerifyOptions()).toEqual({ clockTolerance: 60 });

    expect(
      getBearerTokenFromRequest({ headers: { authorization: "Bearer abc" } })
    ).toBe("abc");
    expect(
      getBearerTokenFromRequest({ headers: { authorization: "a.b.c" } })
    ).toBe("a.b.c");
    expect(
      getBearerTokenFromRequest({ headers: { authorization: "bad" } })
    ).toBeNull();

    await expect(loadUserFromAccessToken("")).rejects.toMatchObject({ status: 401 });

    jwt.verify.mockReturnValueOnce({ id: "u1" });
    userRepository.findById.mockResolvedValueOnce(null);
    await expect(loadUserFromAccessToken("tok")).rejects.toMatchObject({ status: 401 });

    jwt.verify.mockReturnValueOnce({ id: "u1" });
    userRepository.findById.mockResolvedValueOnce({ id: "u1" });
    await expect(loadUserFromAccessToken("tok")).resolves.toEqual({ id: "u1" });
  });

  test("companyUtils helpers cover normalizers and assertions", async () => {
    expect(companyUtils.normalizeTheme("Dark")).toBe("dark");
    expect(companyUtils.normalizeTheme("x")).toBe("light");
    expect(companyUtils.normalizeDomainName(" EXAMPLE.COM ")).toBe("example.com");
    expect(companyUtils.provisionCompanyRow({ name: " ACME " })).toEqual({
      name: "ACME",
      is_active: 1,
    });
    expect(companyUtils.provisionCompanySettingsValues({ name: "Acme" })).toEqual(
      expect.objectContaining({ system_name: "Acme", theme: "light" })
    );
    expect(
      companyUtils.collectProvisionDomains([
        { domain_name: "A.com", auth_email_enabled: true },
        { domain_name: " " },
      ])
    ).toEqual([{ domain_name: "a.com", auth_email_enabled: 1, auth_google_enabled: null }]);

    expect(companyUtils.settingsPatchFromBody({ theme: "dark", auth_email_enabled: 0 })).toEqual(
      expect.objectContaining({ theme: "dark", auth_email_enabled: false })
    );
    expect(
      companyUtils.domainRepositoryPatchFromBody({
        domain_name: "B.com",
        auth_google_enabled: true,
      })
    ).toEqual({ domain_name: "b.com", auth_google_enabled: 1 });

    companyRepository.findCompanyById.mockResolvedValueOnce(null);
    await expect(companyUtils.assertCompanyExists("c1")).rejects.toMatchObject({ status: 404 });
    companyRepository.findCompanyById.mockResolvedValueOnce({ id: "c1" });
    await expect(companyUtils.assertCompanyExists("c1")).resolves.toEqual({ id: "c1" });

    companyRepository.companySettingsExists.mockResolvedValueOnce(false);
    await expect(companyUtils.assertCompanySettingsExist("c1")).rejects.toMatchObject({
      status: 404,
    });
    companyRepository.companySettingsExists.mockResolvedValueOnce(true);
    await expect(companyUtils.assertCompanySettingsExist("c1")).resolves.toBeUndefined();
  });
});
