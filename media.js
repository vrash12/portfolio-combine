const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const storageDir = path.join(__dirname, "storage");
const stagingDir = path.join(storageDir, "staging");
const uploadDir = path.join(storageDir, "uploads");
const thumbnailDir = path.join(storageDir, "thumbnails");
const thumbnailJobs = new Map();

const supportedImageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

function isSupportedImage(filename) {
  return supportedImageExtensions.has(
    path.extname(filename).toLowerCase()
  );
}

function safeMediaFilename(filename) {
  if (!filename || path.basename(filename) !== filename) {
    const error = new Error("Invalid media filename.");
    error.code = "UNSUPPORTED_MEDIA";
    throw error;
  }

  return filename;
}

function normalizeThumbnailWidth(value) {
  const requestedWidth = Number(value);

  if (!Number.isFinite(requestedWidth)) return 900;

  return Math.min(1600, Math.max(320, Math.round(requestedWidth)));
}

async function optimizeUploadedImages(files) {
  const imageFiles = (files || []).filter(
    (file) => file && file.mimetype?.startsWith("image/")
  );

  for (const file of imageFiles) {
    const inputPath = file.path;
    const parsedName = path.parse(file.filename);
    const optimizedFilename = `${parsedName.name}.webp`;
    const optimizedPath = path.join(uploadDir, optimizedFilename);
    const temporaryPath = `${optimizedPath}.tmp`;
    const sharpInput =
      inputPath === optimizedPath ? await fsp.readFile(inputPath) : inputPath;

    await sharp(sharpInput)
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(temporaryPath);

    await fsp.rm(inputPath, { force: true });

    await fsp.rename(temporaryPath, optimizedPath);

    const stats = await fsp.stat(optimizedPath);

    file.filename = optimizedFilename;
    file.path = optimizedPath;
    file.mimetype = "image/webp";
    file.size = stats.size;
  }

  return files;
}

async function buildThumbnail(filename, width) {
  const safeFilename = safeMediaFilename(filename);

  if (!isSupportedImage(safeFilename)) {
    const error = new Error("Unsupported thumbnail source.");
    error.code = "UNSUPPORTED_MEDIA";
    throw error;
  }

  const sourcePath = path.join(uploadDir, safeFilename);

  if (!fs.existsSync(sourcePath)) {
    const error = new Error("Image not found.");
    error.code = "MEDIA_NOT_FOUND";
    throw error;
  }

  await fsp.mkdir(thumbnailDir, { recursive: true });

  const thumbnailFilename = `${safeFilename}-${width}.webp`;
  const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

  if (fs.existsSync(thumbnailPath)) {
    return thumbnailPath;
  }

  const temporaryPath = `${thumbnailPath}.${process.pid}.tmp`;

  try {
    const sourceBuffer = await fsp.readFile(sourcePath);

    await sharp(sourceBuffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(temporaryPath);

    await fsp.rename(temporaryPath, thumbnailPath);
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true });

    if (!fs.existsSync(thumbnailPath)) {
      throw error;
    }
  }

  return thumbnailPath;
}

async function getOrCreateThumbnail(filename, requestedWidth) {
  const width = normalizeThumbnailWidth(requestedWidth);
  const jobKey = `${filename}:${width}`;

  if (!thumbnailJobs.has(jobKey)) {
    const job = buildThumbnail(filename, width).finally(() => {
      thumbnailJobs.delete(jobKey);
    });

    thumbnailJobs.set(jobKey, job);
  }

  return thumbnailJobs.get(jobKey);
}

module.exports = {
  getOrCreateThumbnail,
  optimizeUploadedImages,
  stagingDir,
  thumbnailDir,
  uploadDir,
};
