const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { spawnSync } = require("child_process");
const { uploadDir: mediaDir } = require("../media");

function getFfmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  try {
    return require("ffmpeg-static");
  } catch {
    throw new Error(
      "FFmpeg was not found. Set FFMPEG_PATH or install ffmpeg-static temporarily."
    );
  }
}

function hashFile(filename) {
  const hash = crypto.createHash("sha256");
  const contents = fs.readFileSync(filename);
  hash.update(contents);
  return hash.digest("hex");
}

async function optimizeVideos() {
  const ffmpegPath = getFfmpegPath();
  const filenames = (await fsp.readdir(mediaDir))
    .filter((filename) => path.extname(filename).toLowerCase() === ".mp4")
    .map((filename) => path.join(mediaDir, filename));

  const groups = new Map();

  for (const filename of filenames) {
    const hash = hashFile(filename);
    const group = groups.get(hash) || [];
    group.push(filename);
    groups.set(hash, group);
  }

  const beforeBytes = filenames.reduce(
    (total, filename) => total + fs.statSync(filename).size,
    0
  );

  for (const group of groups.values()) {
    const sourcePath = group[0];
    const temporaryPath = `${sourcePath}.optimized.mp4`;
    const sourceBytes = fs.statSync(sourcePath).size;

    const result = spawnSync(
      ffmpegPath,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        sourcePath,
        "-vf",
        "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))',fps=30",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "28",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        temporaryPath,
      ],
      { encoding: "utf8" }
    );

    if (result.status !== 0) {
      await fsp.rm(temporaryPath, { force: true });
      throw new Error(
        `FFmpeg failed for ${path.basename(sourcePath)}: ${result.stderr}`
      );
    }

    const optimizedBytes = fs.statSync(temporaryPath).size;

    if (optimizedBytes < sourceBytes) {
      for (const duplicatePath of group) {
        await fsp.copyFile(temporaryPath, duplicatePath);
      }

      console.log(
        `Optimized ${group.length}x ${path.basename(sourcePath)}: ${(
          sourceBytes /
          1024 /
          1024
        ).toFixed(2)} MB -> ${(optimizedBytes / 1024 / 1024).toFixed(2)} MB each`
      );
    } else {
      console.log(
        `Kept ${path.basename(sourcePath)} because recompression was not smaller.`
      );
    }

    await fsp.rm(temporaryPath, { force: true });
  }

  const afterBytes = filenames.reduce(
    (total, filename) => total + fs.statSync(filename).size,
    0
  );

  console.log(
    `Video library: ${(beforeBytes / 1024 / 1024).toFixed(2)} MB -> ${(
      afterBytes /
      1024 /
      1024
    ).toFixed(2)} MB`
  );
}

optimizeVideos().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
