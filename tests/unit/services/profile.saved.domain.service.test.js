jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-domain"),
}));
jest.mock("../../../src/repositories/userRepository", () => ({
  findById: jest.fn(),
  findPositionsByUserId: jest.fn(),
}));
jest.mock("../../../src/repositories/chatRepository", () => ({
  getUserRole: jest.fn(),
  findChatMediaByUserId: jest.fn(),
}));
jest.mock("../../../src/validators/profileValidator", () => ({
  requireAuthenticatedUser: jest.fn(),
}));
jest.mock("../../../src/dto/userDto", () => ({
  toProfile: jest.fn(),
}));
jest.mock("../../../src/dto/chatMediaDto", () => ({
  toChatMediaList: jest.fn(),
}));

jest.mock("../../../src/repositories/saved_videoRepository", () => ({
  videoExistsById: jest.fn(),
  insertSaved: jest.fn(),
  listForMember: jest.fn(),
  countByVideoId: jest.fn(),
  listForMemberAndVideo: jest.fn(),
  listAllWithFilters: jest.fn(),
  deleteByMemberAndVideo: jest.fn(),
}));
jest.mock("../../../src/services/videoSearchService", () => ({
  buildVideoSearchCondition: jest.fn(),
  mapSavedVideoRow: jest.fn(),
}));
jest.mock("../../../src/validators/saved_videoValidator", () => ({
  validateAuthenticatedUser: jest.fn(),
  validateVideoIdBody: jest.fn(),
  validateVideoIdParam: jest.fn(),
  validateDeleteParams: jest.fn(),
}));

jest.mock("../../../src/repositories/domainRepository", () => ({
  getAllDomains: jest.fn(),
  findById: jest.fn(),
  findByDomainName: jest.fn(),
  createDomain: jest.fn(),
  updateDomain: jest.fn(),
  deleteDomain: jest.fn(),
}));
jest.mock("../../../src/validators/domainValidator", () => ({
  validateCreateDomain: jest.fn(),
  validateUpdateDomain: jest.fn(),
}));

const userRepository = require("../../../src/repositories/userRepository");
const chatRepository = require("../../../src/repositories/chatRepository");
const profileValidator = require("../../../src/validators/profileValidator");
const userDto = require("../../../src/dto/userDto");
const chatMediaDto = require("../../../src/dto/chatMediaDto");
const profileService = require("../../../src/services/profileService");

const savedVideoRepository = require("../../../src/repositories/saved_videoRepository");
const { buildVideoSearchCondition, mapSavedVideoRow } = require("../../../src/services/videoSearchService");
const savedVideoValidator = require("../../../src/validators/saved_videoValidator");
const savedVideoService = require("../../../src/services/saved_videoService");

const domainRepository = require("../../../src/repositories/domainRepository");
const domainValidator = require("../../../src/validators/domainValidator");
const domainService = require("../../../src/services/domainService");

describe("profile/saved/domain services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("profileService getMyProfile and getMyChatMedia", async () => {
    const req = { user: { id: "u1" } };
    userRepository.findById.mockResolvedValue({ id: "u1" });
    userRepository.findPositionsByUserId.mockResolvedValue([{ title: "Dev" }]);
    userDto.toProfile.mockReturnValue({ id: "u1", positions: [{ title: "Dev" }] });

    await expect(profileService.getMyProfile(req)).resolves.toEqual({
      id: "u1",
      positions: [{ title: "Dev" }],
    });
    expect(profileValidator.requireAuthenticatedUser).toHaveBeenCalledWith(req);

    userRepository.findById.mockResolvedValue(null);
    await expect(profileService.getMyProfile(req)).rejects.toMatchObject({ status: 404 });

    chatRepository.findChatMediaByUserId.mockResolvedValue([{ id: "c1" }]);
    chatMediaDto.toChatMediaList.mockReturnValue([{ id: "c1" }]);
    await expect(profileService.getMyChatMedia(req)).resolves.toEqual([{ id: "c1" }]);

    const reqNoRole = { user: { id: "u1" } };
    chatRepository.getUserRole.mockResolvedValue("Administrator");
    chatRepository.findChatMediaByUserId.mockResolvedValue([]);
    chatMediaDto.toChatMediaList.mockReturnValue([]);
    await expect(profileService.getMyChatMedia(reqNoRole)).resolves.toEqual([]);
    expect(chatRepository.getUserRole).toHaveBeenCalledWith("u1");
  });

  test("savedVideoService create/list/get/delete flows", async () => {
    const req = {
      user: { id: "u1" },
      body: { video_id: "v1" },
      query: { q: "topic", group_id: "g1" },
      params: { video_id: "v1" },
    };

    savedVideoRepository.videoExistsById.mockResolvedValue(false);
    await expect(savedVideoService.createSavedVideo(req)).rejects.toMatchObject({
      status: 400,
      message: "Invalid video_id: not found",
    });

    savedVideoRepository.videoExistsById.mockResolvedValue(true);
    savedVideoRepository.insertSaved.mockResolvedValue(true);
    const created = await savedVideoService.createSavedVideo(req);
    expect(created).toEqual(
      expect.objectContaining({
        user_id: "u1",
        video_id: "v1",
      })
    );

    buildVideoSearchCondition.mockReturnValue({ clause: "x", params: ["y"] });
    mapSavedVideoRow.mockImplementation((row, withWatch) => ({ ...row, withWatch }));
    savedVideoRepository.listForMember.mockResolvedValue([{ id: "s1" }]);
    await expect(savedVideoService.getSavedVideosByUserId(req)).resolves.toEqual([
      { id: "s1", withWatch: true },
    ]);

    savedVideoRepository.countByVideoId.mockResolvedValue(3);
    savedVideoRepository.listForMemberAndVideo.mockResolvedValue([{ id: "s1" }]);
    await expect(savedVideoService.getSavedVideoById(req)).resolves.toEqual({
      savedVideoCount: 3,
      saved_video: [{ id: "s1", withWatch: true }],
    });

    savedVideoRepository.listAllWithFilters.mockResolvedValue([{ id: "s2" }]);
    await expect(savedVideoService.getAllSavedVideos(req)).resolves.toEqual([
      { id: "s2", withWatch: true },
    ]);

    savedVideoRepository.listAllWithFilters.mockResolvedValue([{ id: "s3" }]);
    await expect(
      savedVideoService.getAllSavedVideos({ query: {}, user: null })
    ).resolves.toEqual([{ id: "s3", withWatch: false }]);

    savedVideoRepository.deleteByMemberAndVideo.mockResolvedValue(1);
    await expect(savedVideoService.deleteSavedVideo("u1", "v1")).resolves.toBe(1);
    expect(savedVideoValidator.validateDeleteParams).toHaveBeenCalledWith("u1", "v1");
  });

  test("domainService get/create/update/delete branches", async () => {
    domainRepository.getAllDomains.mockResolvedValue([{ id: "d1" }]);
    await expect(domainService.getAllDomains()).resolves.toEqual([{ id: "d1" }]);

    domainRepository.findById.mockResolvedValueOnce({ id: "d1" });
    await expect(domainService.getDomainById("d1")).resolves.toEqual({ id: "d1" });
    domainRepository.findById.mockResolvedValueOnce(null);
    await expect(domainService.getDomainById("d1")).rejects.toMatchObject({ status: 404 });

    domainRepository.findByDomainName.mockResolvedValueOnce({ id: "d1" });
    await expect(
      domainService.createDomain({ domain_name: "EXAMPLE.COM" })
    ).rejects.toMatchObject({ status: 409 });

    domainRepository.findByDomainName.mockResolvedValueOnce(null);
    domainRepository.createDomain.mockResolvedValue(true);
    await expect(
      domainService.createDomain({ domain_name: "EXAMPLE.COM" })
    ).resolves.toEqual({
      id: "uuid-domain",
      domain_name: "example.com",
      auth_email_enabled: true,
      auth_google_enabled: true,
    });

    domainRepository.findById.mockResolvedValueOnce({ id: "d2", domain_name: "a.com" });
    domainRepository.findByDomainName.mockResolvedValueOnce({ id: "other" });
    await expect(
      domainService.updateDomain("d2", { domain_name: "B.COM" })
    ).rejects.toMatchObject({ status: 409 });

    domainRepository.findById.mockResolvedValueOnce({ id: "d2", domain_name: "a.com" });
    domainRepository.findByDomainName.mockResolvedValueOnce(null);
    domainRepository.updateDomain.mockResolvedValue(true);
    await expect(
      domainService.updateDomain("d2", { domain_name: "B.COM", auth_email_enabled: false })
    ).resolves.toEqual({
      id: "d2",
      domain_name: "b.com",
      auth_email_enabled: false,
    });

    domainRepository.findById.mockResolvedValueOnce(null);
    await expect(domainService.deleteDomain("d2")).rejects.toMatchObject({ status: 404 });
    domainRepository.findById.mockResolvedValueOnce({ id: "d2" });
    domainRepository.deleteDomain.mockResolvedValueOnce(true);
    await expect(domainService.deleteDomain("d2")).resolves.toBeUndefined();
  });
});
