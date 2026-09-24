const assert = require("node:assert/strict");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.JWT_SECRET = "test-only-secret-that-is-longer-than-thirty-two-characters";

const frontendDistDir = fs.mkdtempSync(path.join(os.tmpdir(), "vrms-frontend-test-"));
fs.mkdirSync(path.join(frontendDistDir, "assets"));
fs.writeFileSync(
  path.join(frontendDistDir, "index.html"),
  '<!doctype html><title>VRMS</title><div id="root"></div>'
);
fs.writeFileSync(path.join(frontendDistDir, "assets", "index-AbCd1234.js"), "void 0;");
process.env.FRONTEND_DIST_DIR = frontendDistDir;

test.after(() => {
  fs.rmSync(frontendDistDir, { recursive: true, force: true });
});

const { app } = require("../server");
const { uploadDir } = require("../media");
const { detectAllowedType } = require("../upload-security");
const { sanitizeBlogBody, validateBlogBody } = require("../validation");

test("security headers are enabled and Express is hidden", async () => {
  const response = await request(app).get("/api/health").expect(200);

  assert.equal(response.headers["x-powered-by"], undefined);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["referrer-policy"], "no-referrer");
  assert.match(response.headers["content-security-policy"], /default-src 'none'/);
});

test("the React app is served from the same origin with a page CSP", async () => {
  const response = await request(app)
    .get("/")
    .expect(200)
    .expect("Content-Type", /html/);

  assert.match(response.text, /<div id="root">/);
  assert.equal(response.headers["cache-control"], "no-cache");
  assert.equal(response.headers["x-frame-options"], "DENY");

  const csp = response.headers["content-security-policy"];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test("page routes load the app shell while API and file misses stay 404", async () => {
  const page = await request(app)
    .get("/projects/3")
    .expect(200)
    .expect("Content-Type", /html/);
  assert.match(page.text, /<div id="root">/);

  for (const missingPath of [
    "/api/not-a-route",
    "/static/images/missing.png",
    "/assets/missing-chunk.js",
  ]) {
    const response = await request(app).get(missingPath).expect(404);
    assert.doesNotMatch(response.text, /<div id="root">/);
  }
});

test("fingerprinted frontend assets are cached immutably", async () => {
  const response = await request(app).get("/assets/index-AbCd1234.js").expect(200);

  assert.match(response.headers["cache-control"], /max-age=31536000/);
  assert.match(response.headers["cache-control"], /immutable/);
});

test("CORS permits the configured frontend and rejects other origins", async () => {
  await request(app)
    .options("/api/auth/login")
    .set("Origin", "http://localhost:5173")
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type, authorization")
    .expect(204)
    .expect("Access-Control-Allow-Origin", "http://localhost:5173")
    .expect("Access-Control-Allow-Headers", "Content-Type,Authorization");

  await request(app)
    .options("/api/auth/login")
    .set("Origin", "https://attacker.example")
    .set("Access-Control-Request-Method", "POST")
    .expect(403);
});

test("sessions use an HttpOnly SameSite cookie and protected routes reject guests", async () => {
  const logout = await request(app)
    .post("/api/auth/logout")
    .set("Origin", "http://localhost:5173")
    .expect(200);

  const cookie = logout.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);

  await request(app).get("/api/auth/me").expect(401);
});

test("login and content inputs are strictly validated and sanitized", async () => {
  await request(app)
    .post("/api/auth/login")
    .set("Origin", "http://localhost:5173")
    .send({ email: "not-an-email", password: "anything" })
    .expect(400);

  const clean = sanitizeBlogBody(
    '<p>Hello <strong>world</strong></p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>'
  );
  assert.doesNotMatch(clean, /script|javascript:/i);
  assert.match(clean, /<strong>world<\/strong>/);

  const blog = validateBlogBody({
    title: "Safe title",
    description: "Safe description",
    body: "<p>Safe body</p>",
  });
  assert.equal(blog.title, "Safe title");
});

test("upload verification reads actual file signatures", async () => {
  const temporaryDirectory = await fsp.mkdtemp(path.join(os.tmpdir(), "vrms-upload-test-"));
  const fakeImage = path.join(temporaryDirectory, "fake.jpg");
  await fsp.writeFile(fakeImage, "this is not an image");

  await assert.rejects(() => detectAllowedType(fakeImage), /file contents/i);
  await fsp.rm(temporaryDirectory, { recursive: true, force: true });
});

test("existing media keeps its URL and receives immutable caching", async (context) => {
  const existingImage = fs
    .readdirSync(uploadDir)
    .find((filename) => /\.(?:jpe?g|png|webp)$/i.test(filename));

  if (!existingImage) {
    context.skip("No existing image is available in this checkout.");
    return;
  }

  const response = await request(app)
    .head(`/static/images/${encodeURIComponent(existingImage)}`)
    .expect(200);

  assert.match(response.headers["cache-control"], /max-age=31536000/);
  assert.match(response.headers["cache-control"], /immutable/);
});
