const crypto = require("crypto");
const fsp = require("fs/promises");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const sharp = require("sharp");

const { app } = require("../server");
const {
  getOrCreateThumbnail,
  optimizeUploadedImages,
  stagingDir,
  uploadDir,
} = require("../media");
const {
  cleanupUploadedFiles,
  verifyAndStoreUploadedFiles,
} = require("../upload-security");
const {
  RequestValidationError,
  validateBlogBody,
  validateProjectBody,
} = require("../validation");

const frontendOrigin = new URL(process.env.FRONTEND_URL).origin;

test("production HTTP protections are present", async () => {
  const response = await request(app).get("/api/health").expect(200);

  assert.equal(response.headers["x-powered-by"], undefined);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.match(response.headers["content-security-policy"], /default-src 'none'/);
  assert.match(response.headers["strict-transport-security"], /max-age=31536000/);
  assert.equal(response.headers["referrer-policy"], "no-referrer");
});

test("CORS allows only the configured frontend origin", async () => {
  const allowed = await request(app)
    .get("/api/health")
    .set("Origin", frontendOrigin)
    .expect(200);

  assert.equal(allowed.headers["access-control-allow-origin"], frontendOrigin);

  await request(app)
    .get("/api/health")
    .set("Origin", "https://attacker.example")
    .expect(403);
});

test("session cookies are cleared with hardened attributes", async () => {
  const response = await request(app)
    .post("/api/auth/logout")
    .set("Origin", frontendOrigin)
    .send({})
    .expect(200);
  const cookie = response.headers["set-cookie"]?.[0] || "";

  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /Path=\//i);
});

test("invalid identifiers and unsupported request fields are rejected", async () => {
  await request(app).get("/api/blogs/not-a-number").expect(400);

  await request(app)
    .post("/api/auth/login")
    .set("Origin", frontendOrigin)
    .send({
      email: "admin@example.test",
      password: "not-a-real-password",
      unexpected: true,
    })
    .expect(400);
});

test("blog HTML is sanitized and unsafe project URLs are rejected", () => {
  const blog = validateBlogBody({
    title: "Security test",
    description: "Safe description",
    body: '<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
  });

  assert.equal(blog.body.includes("script"), false);
  assert.equal(blog.body.includes("onclick"), false);
  assert.equal(blog.body.includes("javascript:"), false);

  assert.throws(
    () =>
      validateProjectBody({
        title: "Unsafe project",
        description: "Description",
        category: "Software",
        live_url: "javascript:alert(1)",
      }),
    RequestValidationError
  );
});

function runUploadVerification(files) {
  return new Promise((resolve) => {
    verifyAndStoreUploadedFiles({ files }, {}, (error) => resolve(error));
  });
}

test("upload verification rejects spoofed MIME values and stores valid files safely", async (t) => {
  await fsp.mkdir(stagingDir, { recursive: true });

  const fakePath = path.join(stagingDir, `${crypto.randomUUID()}.upload`);
  await fsp.writeFile(fakePath, "this is not an image");

  const fakeFiles = [
    {
      fieldname: "images",
      mimetype: "image/png",
      filename: path.basename(fakePath),
      path: fakePath,
    },
  ];
  const fakeError = await runUploadVerification(fakeFiles);

  assert.match(fakeError.message, /signature/i);
  await assert.rejects(fsp.stat(fakePath));

  const pngPath = path.join(stagingDir, `${crypto.randomUUID()}.upload`);
  await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: "#ff6b00",
    },
  })
    .png()
    .toFile(pngPath);

  const validFiles = [
    {
      fieldname: "images",
      mimetype: "image/png",
      filename: path.basename(pngPath),
      path: pngPath,
    },
  ];
  let thumbnailPath;

  t.after(async () => {
    await cleanupUploadedFiles(validFiles);

    if (thumbnailPath) {
      await fsp.rm(thumbnailPath, { force: true });
    }
  });

  const validError = await runUploadVerification(validFiles);

  assert.equal(validError, undefined);
  assert.match(validFiles[0].filename, /^[0-9a-f-]{36}\.png$/);
  assert.equal(path.dirname(validFiles[0].path), uploadDir);

  await optimizeUploadedImages(validFiles);
  assert.match(validFiles[0].filename, /^[0-9a-f-]{36}\.webp$/);

  thumbnailPath = await getOrCreateThumbnail(
    validFiles[0].filename,
    640
  );
  await fsp.stat(thumbnailPath);

});
