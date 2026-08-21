const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const defaultUploadDir = path.join(__dirname, "public", "static", "images");
const uploadDir = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : defaultUploadDir;
const stagingDir = path.join(__dirname, "storage", "staging");
const thumbnailDir = path.join(__dirname, "storage", "thumbnails");

for (const directory of [uploadDir, stagingDir, thumbnailDir]) {
  fs.mkdirSync(directory, { recursive: true });
}

function safeMediaFilename(filename) {
  if (
    typeof filename !== "string" ||
    filename.length < 1 ||
    filename.length > 240 ||
    path.basename(filename) !== filename ||
    !/^[a-zA-Z0-9._-]+$/.test(filename)
  ) {
    const error = new Error("Invalid media filename.");
    error.code = "MEDIA_NOT_FOUND";
    throw error;
  }

  return filename;
}

function isImageFilename(filename) {
  return /\.(?:jpe?g|png|webp)$/i.test(filename);
}

async function optimizeUploadedImages(files) {
  const images = (files || []).filter(
    (file) => file?.detectedKind === "image" && file?.path
  );

  for (const file of images) {
    const extension = path.extname(file.filename).toLowerCase();
    const temporaryPath = `${file.path}.${crypto.randomUUID()}.optimized`;

    try {
      let pipeline = sharp(file.path, {
        failOn: "warning",
        limitInputPixels: 50_000_000,
      })
        .rotate()
        .resize({
          width: 2400,
          height: 2400,
          fit: "inside",
          withoutEnlargement: true,
        });

      if (extension === ".jpg" || extension === ".jpeg") {
        pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
      } else if (extension === ".png") {
        pipeline = pipeline.png({ compressionLevel: 9, effort: 8 });
      } else if (extension === ".webp") {
        pipeline = pipeline.webp({ quality: 82, effort: 5 });
      } else {
        continue;
      }

      await pipeline.toFile(temporaryPath);
      await fsp.rename(temporaryPath, file.path);
      const stat = await fsp.stat(file.path);
      file.size = stat.size;
      file.optimized = true;
    } catch (error) {
      await fsp.rm(temporaryPath, { force: true }).catch(() => {});
      console.error(`Image optimization skipped for ${file.filename}:`, error.message);
    }
  }

  return files || [];
}

async function getOrCreateThumbnail(filename, requestedWidth = 900) {
  const safeFilename = safeMediaFilename(filename);

  if (!isImageFilename(safeFilename)) {
    const error = new Error("Unsupported media type.");
    error.code = "UNSUPPORTED_MEDIA";
    throw error;
  }

  const width = Math.min(1600, Math.max(320, Number(requestedWidth) || 900));
  const sourcePath = path.join(uploadDir, safeFilename);

  try {
    const stat = await fsp.stat(sourcePath);
    if (!stat.isFile()) throw new Error("Not a file");
  } catch {
    const error = new Error("Media not found.");
    error.code = "MEDIA_NOT_FOUND";
    throw error;
  }

  const thumbnailName = `${safeFilename}-${width}.webp`;
  const thumbnailPath = path.join(thumbnailDir, thumbnailName);

  try {
    await fsp.access(thumbnailPath);
    return thumbnailPath;
  } catch {
    // Generate the cache entry below.
  }

  const temporaryPath = `${thumbnailPath}.${crypto.randomUUID()}.tmp`;

  try {
    await sharp(sourcePath, {
      failOn: "warning",
      limitInputPixels: 50_000_000,
    })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(temporaryPath);

    await fsp.rename(temporaryPath, thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => {});
    error.code = error.code || "UNSUPPORTED_MEDIA";
    throw error;
  }
}

module.exports = {
  getOrCreateThumbnail,
  optimizeUploadedImages,
  stagingDir,
  thumbnailDir,
  uploadDir,
};
