jest.mock("../../../src/validators/chatBotValidator", () => ({
  validateChatRequest: jest.fn(),
}));
jest.mock("../../../src/config/gemini", () => ({
  generateContent: jest.fn(),
}));
jest.mock("../../../src/utils/loginAttempts", () => ({
  requiresCaptcha: jest.fn(),
  getAttemptsInfo: jest.fn(),
}));
jest.mock("../../../src/utils/captcha", () => ({
  verifyCaptcha: jest.fn(),
}));

const chatBotValidator = require("../../../src/validators/chatBotValidator");
const geminiModel = require("../../../src/config/gemini");
const { requiresCaptcha, getAttemptsInfo } = require("../../../src/utils/loginAttempts");
const { verifyCaptcha } = require("../../../src/utils/captcha");

const chatBotService = require("../../../src/services/chatBotService");
const { checkLoginSecurity } = require("../../../src/services/auth/authServiceSecurity");

describe("chat and security services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("chatBotService validates request and returns assistant payload", async () => {
    geminiModel.generateContent.mockResolvedValue({
      text: () => "Hello from model",
    });
    const req = { body: { conversation_id: "conv1" } };

    const result = await chatBotService.chat(req);

    expect(chatBotValidator.validateChatRequest).toHaveBeenCalledWith(req);
    expect(geminiModel.generateContent).toHaveBeenCalledWith("Hello");
    expect(result).toEqual({
      conversation_id: "conv1",
      reply: "Hello from model",
      role: "assistant",
    });
  });

  test("chatBotService handles missing conversation id", async () => {
    geminiModel.generateContent.mockResolvedValue({
      text: () => "Reply",
    });
    const req = { body: {} };
    const result = await chatBotService.chat(req);
    expect(result.conversation_id).toBeNull();
  });

  test("checkLoginSecurity blocks when captcha is required and missing", async () => {
    requiresCaptcha.mockReturnValue(true);
    getAttemptsInfo.mockReturnValue({ remaining: 2 });

    const result = await checkLoginSecurity("a@b.com", null);

    expect(result).toEqual({
      blocked: true,
      requiresCaptcha: true,
      remaining: 2,
    });
    expect(verifyCaptcha).not.toHaveBeenCalled();
  });

  test("checkLoginSecurity verifies captcha token when provided", async () => {
    requiresCaptcha.mockReturnValue(false);
    verifyCaptcha.mockResolvedValue(true);

    const result = await checkLoginSecurity("a@b.com", "token-captcha");

    expect(verifyCaptcha).toHaveBeenCalledWith("token-captcha");
    expect(result).toEqual({ blocked: false });
  });
});
