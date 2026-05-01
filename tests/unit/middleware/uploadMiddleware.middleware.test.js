const mockFieldsHandler = jest.fn();
const mockSingleHandler = jest.fn();

jest.mock("../../../src/middleware/uploadFile", () => ({
  upload: {
    fields: jest.fn(() => mockFieldsHandler),
    single: jest.fn(() => mockSingleHandler),
  },
}));

const uploadMiddleware = require("../../../src/middleware/uploadMiddleware");
const { upload } = require("../../../src/middleware/uploadFile");

describe("uploadMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFieldsHandler.mockReset();
    mockSingleHandler.mockReset();
  });

  test("calls next when multer fields handler succeeds", () => {
    mockFieldsHandler.mockImplementation((req, res, cb) => cb(null));
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    uploadMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 400 when multer fields handler fails", () => {
    mockFieldsHandler.mockImplementation((req, res, cb) =>
      cb(new Error("File too large"))
    );
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    uploadMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "File too large",
    });
  });
});

describe("summarizeVideoUpload", () => {
  test("calls upload.single with file and continues on success", () => {
    mockSingleHandler.mockImplementation((req, res, cb) => cb(null));
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    uploadMiddleware.summarizeVideoUpload(req, res, next);

    expect(upload.single).toHaveBeenCalledWith("file");
    expect(next).toHaveBeenCalled();
  });

  test("returns 400 on single upload error", () => {
    mockSingleHandler.mockImplementation((req, res, cb) =>
      cb(new Error("Bad mimetype"))
    );
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    uploadMiddleware.summarizeVideoUpload(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Bad mimetype",
    });
  });
});
