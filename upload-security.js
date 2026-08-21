const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const { stagingDir, uploadDir } = require("./media");

const allowedBrowserMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

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

function createSafeStagingFilename() {
  return `${crypto.randomUUID()}.upload`;
}

function startsWith(buffer, bytes) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

async function readHeader(filename) {
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
  const header = await readHeader(filename);

  if (startsWith(header, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", extension: "jpg", kind: "image" };
  }

  if (startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", extension: "png", kind: "image" };
  }

  if (
    header.subarray(0, 4).toString("ascii") === "RIFF" &&
    header.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp", kind: "image" };
  }

  if (header.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = header.subarray(8, 12).toString("ascii").toLowerCase();
    const quickTime = brand.startsWith("qt");

    return {
      mime: quickTime ? "video/quicktime" : "video/mp4",
      extension: quickTime ? "mov" : "mp4",
      kind: "video",
    };
  }

  if (startsWith(header, [0x1a, 0x45, 0xdf, 0xa3])) {
    const headerText = header.toString("ascii").toLowerCase();

    if (headerText.includes("webm")) {
      return { mime: "video/webm", extension: "webm", kind: "video" };
    }
  }

  throw new UploadValidationError(
    "The uploaded file contents do not match an allowed image or video type."
  );
}

function expectedKind(fieldname) {
  if (fieldname === "image" || fieldname === "images") return "image";
  if (fieldname === "video" || fieldname === "videos") return "video";
  return null;
}

function isInsideDirectory(filename, directory) {
  const relative = path.relative(path.resolve(directory), path.resolve(filename));
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function removeKnownUpload(file) {
  if (!file?.path) return;

  if (
    !isInsideDirectory(file.path, stagingDir) &&
    !isInsideDirectory(file.path, uploadDir)
  ) {
    return;
  }

  await fsp.rm(file.path, { force: true });
}

async function cleanupUploadedFiles(files) {
  await Promise.allSettled(getUploadedFiles(files).map(removeKnownUpload));
}

async function moveFile(source, destination) {
  try {
    await fsp.rename(source, destination);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    await fsp.copyFile(source, destination, fs.constants.COPYFILE_EXCL);
    await fsp.rm(source, { force: true });
  }
}

async function verifyAndStoreUploadedFiles(request, response, next) {
  const files = getUploadedFiles(request.files);

  try {
    for (const file of files) {
      const detected = await detectAllowedType(file.path);
      const fieldKind = expectedKind(file.fieldname);

      if (!fieldKind || fieldKind !== detected.kind) {
        throw new UploadValidationError(
          `The ${file.fieldname || "upload"} field contains the wrong file type.`
        );
      }

      const maximumBytes = detected.kind === "image"
        ? 12 * 1024 * 1024
        : 50 * 1024 * 1024;

      if (file.size > maximumBytes) {
        throw new UploadValidationError(
          detected.kind === "image"
            ? "Each image must be 12 MB or smaller."
            : "Each video must be 50 MB or smaller."
        );
      }

      const safeFilename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}.${detected.extension}`;
      const destination = path.join(uploadDir, safeFilename);

      await moveFile(file.path, destination);

      file.filename = safeFilename;
      file.path = destination;
      file.mimetype = detected.mime;
      file.detectedKind = detected.kind;
    }

    next();
  } catch (error) {
    await cleanupUploadedFiles(files);
    next(error);
  }
}

module.exports = {
  UploadValidationError,
  allowedBrowserMimeTypes,
  cleanupUploadedFiles,
  createSafeStagingFilename,
  detectAllowedType,
  getUploadedFiles,
  verifyAndStoreUploadedFiles,
};
