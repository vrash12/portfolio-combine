const crypto = require("crypto");
const fsp = require("fs/promises");
const path = require("path");

const { stagingDir, uploadDir } = require("./media");

const allowedDetectedTypes = new Map([
  ["image/jpeg", { extension: "jpg", kind: "image" }],
  ["image/png", { extension: "png", kind: "image" }],
  ["image/webp", { extension: "webp", kind: "image" }],
  ["video/mp4", { extension: "mp4", kind: "video" }],
  ["video/webm", { extension: "webm", kind: "video" }],
  ["video/quicktime", { extension: "mov", kind: "video" }],
]);

const allowedBrowserMimeTypes = new Set(allowedDetectedTypes.keys());
allowedBrowserMimeTypes.add("image/jpg");

class UploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UploadValidationError";
    this.statusCode = 400;
  }
}

function getUploadedFiles(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files.filter(Boolean);

  return Object.values(files).flat().filter(Boolean);
}

function expectedKindForField(fieldname) {
  if (fieldname === "image" || fieldname === "images") return "image";
  if (fieldname === "video" || fieldname === "videos") return "video";

  return null;
}

function startsWithBytes(buffer, bytes) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

async function readFileHeader(filename) {
  const handle = await fsp.open(filename, "r");

  try {
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function detectAllowedType(filename) {
  const header = await readFileHeader(filename);

  if (startsWithBytes(header, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", extension: "jpg", kind: "image" };
  }

  if (
    startsWithBytes(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { mime: "image/png", extension: "png", kind: "image" };
  }

  if (
    header.subarray(0, 4).toString("ascii") === "RIFF" &&
    header.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp", kind: "image" };
  }

  if (startsWithBytes(header, [0x1a, 0x45, 0xdf, 0xa3])) {
    const headerText = header.toString("ascii").toLowerCase();

    if (headerText.includes("webm")) {
      return { mime: "video/webm", extension: "webm", kind: "video" };
    }
  }

  if (
    header.length >= 12 &&
    header.subarray(4, 8).toString("ascii") === "ftyp"
  ) {
    const majorBrand = header.subarray(8, 12).toString("ascii");

    if (majorBrand === "qt  ") {
      return { mime: "video/quicktime", extension: "mov", kind: "video" };
    }

    const mp4Brands = new Set([
      "isom",
      "iso2",
      "iso3",
      "iso4",
      "iso5",
      "iso6",
      "mp41",
      "mp42",
      "avc1",
      "M4V ",
      "MSNV",
      "dash",
    ]);

    if (mp4Brands.has(majorBrand)) {
      return { mime: "video/mp4", extension: "mp4", kind: "video" };
    }
  }

  return null;
}

async function cleanupUploadedFiles(files) {
  const uploadedFiles = getUploadedFiles(files);

  await Promise.all(
    uploadedFiles.map((file) =>
      file?.path
        ? fsp.rm(file.path, {
            force: true,
            maxRetries: 10,
            retryDelay: 100,
          })
        : Promise.resolve()
    )
  );
}

async function verifyAndStoreUploadedFiles(request, response, next) {
  const uploadedFiles = getUploadedFiles(request.files);

  if (uploadedFiles.length === 0) {
    next();
    return;
  }

  try {
    await fsp.mkdir(uploadDir, { recursive: true });

    for (const file of uploadedFiles) {
      const expectedKind = expectedKindForField(file.fieldname);
      const detected = await detectAllowedType(file.path);
      const allowedType = detected
        ? allowedDetectedTypes.get(detected.mime)
        : null;

      if (!expectedKind || !allowedType || allowedType.kind !== expectedKind) {
        throw new UploadValidationError(
          "An uploaded file did not match an allowed image or video signature."
        );
      }

      const safeFilename = `${crypto.randomUUID()}.${allowedType.extension}`;
      const finalPath = path.join(uploadDir, safeFilename);

      await fsp.rename(file.path, finalPath);

      file.filename = safeFilename;
      file.path = finalPath;
      file.mimetype = detected.mime;
    }

    next();
  } catch (error) {
    await cleanupUploadedFiles(request.files);
    next(error);
  }
}

function createSafeStagingFilename() {
  return `${crypto.randomUUID()}.upload`;
}

module.exports = {
  UploadValidationError,
  allowedBrowserMimeTypes,
  cleanupUploadedFiles,
  createSafeStagingFilename,
  detectAllowedType,
  getUploadedFiles,
  stagingDir,
  verifyAndStoreUploadedFiles,
};
