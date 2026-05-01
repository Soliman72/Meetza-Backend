const { Writable } = require("stream");

const mockUploadStream = jest.fn();
const mockConfig = jest.fn();
const mockMemoryStorage = jest.fn(() => ({ kind: "memory" }));
const mockMulterFactory = jest.fn(() => ({
  fields: jest.fn(),
  single: jest.fn(),
}));

jest.mock("cloudinary", () => ({
  v2: {
    config: mockConfig,
    uploader: {
      upload_stream: mockUploadStream,
    },
  },
}));

jest.mock("multer", () => {
  const fn = (...args) => mockMulterFactory(...args);
  fn.memoryStorage = mockMemoryStorage;
  return fn;
});

const {
  uploadToCloudinary,
  uploadToCloudinaryResources,
} = require("../../../src/middleware/uploadFile");

const writableNoop = () =>
  new Writable({
    write(_chunk, _enc, callback) {
      callback();
    },
  });

describe("uploadFile middleware helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = "main-cloud";
    process.env.CLOUDINARY_API_KEY = "main-key";
    process.env.CLOUDINARY_API_SECRET = "main-secret";
    process.env.CLOUDINARY_RESOURCES_CLOUD_NAME = "res-cloud";
    process.env.CLOUDINARY_RESOURCES_API_KEY = "res-key";
    process.env.CLOUDINARY_RESOURCES_API_SECRET = "res-secret";
  });

  test("uploadToCloudinary resolves secure URL", async () => {
    mockUploadStream.mockImplementation((_opts, cb) => {
      process.nextTick(() => cb(null, { secure_url: "https://cdn/file.jpg" }));
      return writableNoop();
    });

    const url = await uploadToCloudinary(
      { buffer: Buffer.from("x") },
      "images",
      "image"
    );

    expect(url).toBe("https://cdn/file.jpg");
    expect(mockUploadStream).toHaveBeenCalledWith(
      { folder: "images", resource_type: "image" },
      expect.any(Function)
    );
  });

  test("uploadToCloudinary uses default folder and resource type", async () => {
    mockUploadStream.mockImplementation((_opts, cb) => {
      process.nextTick(() => cb(null, { secure_url: "https://cdn/default" }));
      return writableNoop();
    });

    await uploadToCloudinary({ buffer: Buffer.from("x") });

    expect(mockUploadStream).toHaveBeenCalledWith(
      { folder: "default_folder", resource_type: "auto" },
      expect.any(Function)
    );
  });

  test("uploadToCloudinary rejects when upload fails", async () => {
    mockUploadStream.mockImplementation((_opts, cb) => {
      process.nextTick(() => cb(new Error("cloud fail")));
      return writableNoop();
    });

    await expect(
      uploadToCloudinary({ buffer: Buffer.from("x") }, "images", "image")
    ).rejects.toThrow("cloud fail");
  });

  test("uploadToCloudinaryResources switches to resource credentials", async () => {
    mockUploadStream.mockImplementation((_opts, cb) => {
      process.nextTick(() => cb(null, { secure_url: "https://cdn/doc.pdf" }));
      return writableNoop();
    });

    const url = await uploadToCloudinaryResources(
      { buffer: Buffer.from("x") },
      "meeting_content_resources",
      "raw"
    );

    expect(url).toBe("https://cdn/doc.pdf");
    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: "res-cloud",
      api_key: "res-key",
      api_secret: "res-secret",
    });
  });

  test("uploadToCloudinaryResources falls back to main credentials", async () => {
    delete process.env.CLOUDINARY_RESOURCES_CLOUD_NAME;
    delete process.env.CLOUDINARY_RESOURCES_API_KEY;
    delete process.env.CLOUDINARY_RESOURCES_API_SECRET;

    mockUploadStream.mockImplementation((_opts, cb) => {
      process.nextTick(() => cb(null, { secure_url: "https://cdn/fallback" }));
      return writableNoop();
    });

    await uploadToCloudinaryResources({ buffer: Buffer.from("x") });

    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: "main-cloud",
      api_key: "main-key",
      api_secret: "main-secret",
    });
  });
});
