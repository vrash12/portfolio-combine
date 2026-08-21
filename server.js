// backend/server.js

require("dotenv").config({ quiet: true });

const crypto = require("crypto");
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");

const { initDb, run, get, all } = require("./db");
const { requireAuth } = require("./middleware/auth");
const {
  IS_PRODUCTION,
  SESSION_AUDIENCE,
  SESSION_COOKIE_NAME,
  SESSION_ISSUER,
  SESSION_TTL_MINUTES,
  assertSecurityConfiguration,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
} = require("./auth-config");
const {
  getOrCreateThumbnail,
  optimizeUploadedImages,
  stagingDir,
  thumbnailDir,
  uploadDir,
} = require("./media");
const {
  allowedBrowserMimeTypes,
  cleanupUploadedFiles,
  createSafeStagingFilename,
  verifyAndStoreUploadedFiles,
} = require("./upload-security");
const {
  validateAnalyticsBody,
  validateBlogBody,
  validateIdParam,
  validateLoginBody,
  validateProjectBody,
} = require("./validation");

const app = express();

app.disable("x-powered-by");

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function parseFrontendOrigin(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("FRONTEND_URL must be a valid absolute URL.");
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    (IS_PRODUCTION && parsed.protocol !== "https:")
  ) {
    throw new Error("FRONTEND_URL must contain one exact HTTPS origin.");
  }

  return parsed.origin;
}

const FRONTEND_ORIGIN = parseFrontendOrigin(FRONTEND_URL);

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(thumbnailDir, { recursive: true });

if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    hsts: IS_PRODUCTION
      ? { maxAge: 31536000, includeSubDomains: true, preload: false }
      : false,
    referrerPolicy: { policy: "no-referrer" },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === FRONTEND_ORIGIN) {
        callback(null, true);
        return;
      }

      const error = new Error("Origin is not permitted by CORS.");
      error.statusCode = 403;
      callback(error);
    },
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
    maxAge: 86400,
  })
);

app.use(compression({ threshold: 1024 }));
app.use(cookieParser());
app.use(express.json({ limit: "64kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));

app.use(function requireTrustedMutationOrigin(request, response, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");
  if (origin === FRONTEND_ORIGIN || (!IS_PRODUCTION && !origin)) {
    next();
    return;
  }

  return response.status(403).json({
    message: "The request origin is not trusted.",
  });
});

app.use(["/api/auth", "/api/admin"], function privateResponseCache(
  request,
  response,
  next
) {
  response.set("Cache-Control", "no-store");
  next();
});

app.get("/static/thumbnails/:filename", async function thumbnail(
  request,
  response
) {
  try {
    if (Object.keys(request.query).some((key) => key !== "w")) {
      return response.status(400).json({ message: "Unsupported thumbnail query." });
    }

    const width = request.query.w === undefined ? 900 : Number(request.query.w);
    if (!Number.isInteger(width) || width < 320 || width > 1600) {
      return response.status(400).json({
        message: "Thumbnail width must be between 320 and 1600 pixels.",
      });
    }

    const thumbnailPath = await getOrCreateThumbnail(request.params.filename, width);
    response.set({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/webp",
    });
    return response.sendFile(thumbnailPath);
  } catch (error) {
    if (error.code === "MEDIA_NOT_FOUND" || error.code === "UNSUPPORTED_MEDIA") {
      return response.status(404).end();
    }

    console.error("Failed to create thumbnail:", error);
    return response.status(500).end();
  }
});

app.use(
  "/static/images",
  express.static(uploadDir, {
    dotfiles: "deny",
    immutable: true,
    index: false,
    maxAge: "1y",
    redirect: false,
  })
);

function safeDeleteFile(filename) {
  if (!filename) return;

  const safeFilename = path.basename(filename);
  if (safeFilename !== filename) {
    console.error("Refused to delete an unsafe media filename.");
    return;
  }

  const filePath = path.join(uploadDir, safeFilename);

  fs.rm(filePath, { force: true }, function removeFile(error) {
    if (error && error.code !== "ENOENT") {
      console.error("Failed to delete uploaded file:", error);
    }
  });

  fs.readdir(thumbnailDir, function removeGeneratedThumbnails(error, files) {
    if (error) return;
    for (const thumbnail of files) {
      if (!thumbnail.startsWith(`${safeFilename}-`)) continue;
      fs.rm(path.join(thumbnailDir, thumbnail), { force: true }, () => {});
    }
  });
}

function setPublicDataCache(response) {
  response.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
}

function toPublishedValue(value, fallback = 1) {
  if (value === undefined || value === null) return fallback;

  return value === "0" || value === 0 || value === "false" ? 0 : 1;
}

function toFeaturedValue(value, fallback = 0) {
  if (value === undefined || value === null) return fallback;

  return value === "1" || value === 1 || value === "true" ? 1 : 0;
}

async function ensureProjectMediaSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS project_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      image VARCHAR(255) NOT NULL,
      caption VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_project_images_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS project_videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      video VARCHAR(255) NOT NULL,
      caption VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_project_videos_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const videoColumn = await all(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'projects'
      AND COLUMN_NAME = 'video'
    `
  );

  if (videoColumn.length === 0) {
    await run(`
      ALTER TABLE projects
      ADD COLUMN video VARCHAR(255) NULL AFTER image
    `);
  }

  await run(`
    DELETE pi
    FROM project_images pi
    INNER JOIN projects p ON p.id = pi.project_id
    WHERE p.image IS NOT NULL AND p.image = pi.image
  `);
}

async function getBlogImages(blogId) {
  return all(
    `
    SELECT *
    FROM blog_images
    WHERE blog_id = ?
    ORDER BY id ASC
    `,
    [blogId]
  );
}

async function getProjectImages(projectId) {
  return all(
    `
    SELECT *
    FROM project_images
    WHERE project_id = ?
    ORDER BY id ASC
    `,
    [projectId]
  );
}

async function getProjectVideos(projectId) {
  return all(
    `
    SELECT *
    FROM project_videos
    WHERE project_id = ?
    ORDER BY id ASC
    `,
    [projectId]
  );
}

async function attachBlogImages(blog) {
  const images = await getBlogImages(blog.id);

  return {
    ...blog,
    images,
  };
}

async function attachProjectMedia(project) {
  const rawImages = await getProjectImages(project.id);
  const videos = await getProjectVideos(project.id);

  const images = rawImages.filter((image) => image.image !== project.image);

  return {
    ...project,
    images,
    videos,
  };
}

const storage = multer.diskStorage({
  destination: function destination(request, file, callback) {
    callback(null, stagingDir);
  },

  filename: function filename(request, file, callback) {
    callback(null, createSafeStagingFilename());
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20,
    fields: 20,
    parts: 40,
    fieldNameSize: 100,
    fieldSize: 256 * 1024,
    headerPairs: 100,
  },

  fileFilter: function fileFilter(request, file, callback) {
    const allowedFields = new Set(["image", "images", "video", "videos"]);

    if (!allowedFields.has(file.fieldname) || !allowedBrowserMimeTypes.has(file.mimetype)) {
      const error = new Error(
        "Only JPG, PNG, WEBP, MP4, WEBM, and MOV files are allowed."
      );
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

const projectUploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 12 },
  { name: "video", maxCount: 1 },
  { name: "videos", maxCount: 4 },
]);

async function optimizeRequestImages(request, response, next) {
  try {
    const files = Array.isArray(request.files)
      ? request.files
      : Object.values(request.files || {}).flat();
    await optimizeUploadedImages(files);
    next();
  } catch (error) {
    next(error);
  }
}

function validateBlogRequest(partial = false) {
  return function validateBlog(request, response, next) {
    try {
      request.body = validateBlogBody(request.body, { partial });
      next();
    } catch (error) {
      next(error);
    }
  };
}

function validateProjectRequest(partial = false) {
  return function validateProject(request, response, next) {
    try {
      request.body = validateProjectBody(request.body, { partial });
      next();
    } catch (error) {
      next(error);
    }
  };
}

function validateAnalyticsRequest(request, response, next) {
  try {
    request.body = validateAnalyticsBody(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

function validateListQuery(allowedKeys) {
  const allowed = new Set(allowedKeys);

  return function validateQuery(request, response, next) {
    const unexpected = Object.keys(request.query).filter((key) => !allowed.has(key));
    if (unexpected.length > 0) {
      const error = new Error("Unsupported query parameter.");
      error.statusCode = 400;
      next(error);
      return;
    }

    for (const [key, value] of Object.entries(request.query)) {
      if (typeof value !== "string" || value.length > 100) {
        const error = new Error(`${key} is invalid.`);
        error.statusCode = 400;
        next(error);
        return;
      }
    }

    next();
  };
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const failedAccountLogins = new Map();
const dummyPasswordHashPromise = bcrypt.hash(crypto.randomUUID(), 12);

const loginIpLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Please try again later." },
});

function accountKey(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

function getAccountFailure(email) {
  const key = accountKey(email);
  const failure = failedAccountLogins.get(key);

  if (!failure || failure.resetAt <= Date.now()) {
    failedAccountLogins.delete(key);
    return null;
  }

  return failure;
}

function recordAccountFailure(email) {
  const key = accountKey(email);
  const current = getAccountFailure(email);

  if (failedAccountLogins.size >= 5000 && !failedAccountLogins.has(key)) {
    failedAccountLogins.delete(failedAccountLogins.keys().next().value);
  }

  failedAccountLogins.set(key, {
    count: (current?.count || 0) + 1,
    resetAt: current?.resetAt || Date.now() + LOGIN_WINDOW_MS,
  });
}

function resetAccountFailures(email) {
  failedAccountLogins.delete(accountKey(email));
}

function validateLoginRequest(request, response, next) {
  try {
    request.validatedLogin = validateLoginBody(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

function loginAccountLimiter(request, response, next) {
  const failure = getAccountFailure(request.validatedLogin.email);

  if (failure?.count >= 5) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((failure.resetAt - Date.now()) / 1000)
    );
    response.set("Retry-After", String(retryAfterSeconds));
    return response.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  }

  next();
}

app.get("/", function home(request, response) {
  response.json({
    message: "Portfolio Adventure Blog API is running.",
  });
});

app.get("/api/health", function health(request, response) {
  response.json({
    status: "ok",
    backend: "Node.js",
    port: PORT,
  });
});

/* =========================================================
   AUTH ROUTES
   ========================================================= */

app.post(
  "/api/auth/login",
  loginIpLimiter,
  validateLoginRequest,
  loginAccountLimiter,
  async function login(request, response) {
    try {
      const { email, password, otp } = request.validatedLogin;
      const user = await get("SELECT * FROM users WHERE email = ?", [email]);
      const passwordHash = user?.password || (await dummyPasswordHashPromise);
      const passwordMatches = await bcrypt.compare(password, passwordHash);

      if (!user || !passwordMatches) {
        recordAccountFailure(email);
        return response.status(401).json({
          message: "Invalid email or password.",
        });
      }

      const mfaSecret = (process.env.ADMIN_MFA_SECRET || "")
        .replace(/\s+/g, "")
        .toUpperCase();
      const requiresMfa = user.role === "admin" && Boolean(mfaSecret);

      if (requiresMfa && !otp) {
        response.set("Cache-Control", "no-store");
        return response.json({
          message: "Additional verification is required.",
          mfaRequired: true,
        });
      }

      if (requiresMfa && !authenticator.check(otp, mfaSecret)) {
        recordAccountFailure(email);
        return response.status(401).json({
          message: "Invalid email, password, or authenticator code.",
        });
      }

      resetAccountFailures(email);

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          algorithm: "HS256",
          audience: SESSION_AUDIENCE,
          expiresIn: `${SESSION_TTL_MINUTES}m`,
          issuer: SESSION_ISSUER,
          jwtid: crypto.randomUUID(),
        }
      );

      response.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
      response.set("Cache-Control", "no-store");

      return response.json({
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
      return response.status(500).json({ message: "Login failed." });
    }
  }
);

app.post("/api/auth/logout", function logout(request, response) {
  response.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());
  response.set("Cache-Control", "no-store");
  return response.json({ message: "Logged out successfully." });
});

app.get("/api/auth/me", requireAuth, async function me(request, response) {
  response.set("Cache-Control", "no-store");
  response.json({
    user: {
      id: request.user.id,
      name: request.user.name,
      email: request.user.email,
      role: request.user.role,
    },
  });
});

/* =========================================================
   BLOG ROUTES
   ========================================================= */

app.get("/api/blogs", validateListQuery(["tag", "category"]), async function getBlogs(request, response) {
  try {
    const { tag, category } = request.query;

    const params = [];

    let sql = `
      SELECT *
      FROM blogs
      WHERE published = 1
    `;

    if (tag) {
      sql += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += `
      ORDER BY
        COALESCE(adventure_date, created_at) DESC,
        id DESC
    `;

    const blogs = await all(sql, params);
    const blogsWithImages = await Promise.all(blogs.map(attachBlogImages));

    setPublicDataCache(response);
    return response.json(blogsWithImages);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);

    return response.status(500).json({
      message: "Failed to fetch blogs.",
    });
  }
});

app.get("/api/blogs/:id", validateIdParam, async function getBlogById(request, response) {
  try {
    const { id } = request.params;

    const blog = await get(
      `
      SELECT *
      FROM blogs
      WHERE id = ? AND published = 1
      `,
      [id]
    );

    if (!blog) {
      return response.status(404).json({
        message: "Blog post not found.",
      });
    }

    const blogWithImages = await attachBlogImages(blog);

    setPublicDataCache(response);
    return response.json(blogWithImages);
  } catch (error) {
    console.error("Failed to fetch blog:", error);

    return response.status(500).json({
      message: "Failed to fetch blog post.",
    });
  }
});

app.post(
  "/api/blogs",
  requireAuth,
  upload.array("images", 12),
  verifyAndStoreUploadedFiles,
  optimizeRequestImages,
  validateBlogRequest(false),
  async function createBlog(request, response) {
    try {
      const {
        title,
        description,
        body,
        tags,
        category,
        location,
        adventure_date,
        published,
      } = request.body;

      if (!title || !description || !body) {
        return response.status(400).json({
          message: "Title, description, and body are required.",
        });
      }

      const uploadedImages = request.files || [];
      const coverImage =
        uploadedImages.length > 0 ? uploadedImages[0].filename : null;

      const result = await run(
        `
        INSERT INTO blogs
        (
          title,
          description,
          body,
          image,
          tags,
          category,
          location,
          adventure_date,
          published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title,
          description,
          body,
          coverImage,
          tags || "",
          category || "",
          location || "",
          adventure_date || null,
          toPublishedValue(published, 1),
        ]
      );

      for (const file of uploadedImages) {
        await run(
          `
          INSERT INTO blog_images (blog_id, image)
          VALUES (?, ?)
          `,
          [result.id, file.filename]
        );
      }

      const createdBlog = await get("SELECT * FROM blogs WHERE id = ?", [
        result.id,
      ]);

      const blogWithImages = await attachBlogImages(createdBlog);

      return response.status(201).json(blogWithImages);
    } catch (error) {
      console.error("Failed to create blog:", error);

      return response.status(500).json({
        message: "Failed to create blog post.",
      });
    }
  }
);

app.put(
  "/api/blogs/:id",
  requireAuth,
  validateIdParam,
  upload.array("images", 12),
  verifyAndStoreUploadedFiles,
  optimizeRequestImages,
  validateBlogRequest(true),
  async function updateBlog(request, response) {
    try {
      const { id } = request.params;

      const existingBlog = await get("SELECT * FROM blogs WHERE id = ?", [id]);

      if (!existingBlog) {
        return response.status(404).json({
          message: "Blog post not found.",
        });
      }

      const uploadedImages = request.files || [];

      const image =
        uploadedImages.length > 0
          ? uploadedImages[0].filename
          : existingBlog.image;

      const updatedBlog = {
        title: request.body.title ?? existingBlog.title,
        description: request.body.description ?? existingBlog.description,
        body: request.body.body ?? existingBlog.body,
        image,
        tags: request.body.tags ?? existingBlog.tags,
        category: request.body.category ?? existingBlog.category,
        location: request.body.location ?? existingBlog.location,
        adventure_date:
          request.body.adventure_date ?? existingBlog.adventure_date,
        published: toPublishedValue(
          request.body.published,
          existingBlog.published
        ),
      };

      await run(
        `
        UPDATE blogs
        SET
          title = ?,
          description = ?,
          body = ?,
          image = ?,
          tags = ?,
          category = ?,
          location = ?,
          adventure_date = ?,
          published = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          updatedBlog.title,
          updatedBlog.description,
          updatedBlog.body,
          updatedBlog.image,
          updatedBlog.tags,
          updatedBlog.category,
          updatedBlog.location,
          updatedBlog.adventure_date,
          updatedBlog.published,
          id,
        ]
      );

      for (const file of uploadedImages) {
        await run(
          `
          INSERT INTO blog_images (blog_id, image)
          VALUES (?, ?)
          `,
          [id, file.filename]
        );
      }

      const savedBlog = await get("SELECT * FROM blogs WHERE id = ?", [id]);
      const blogWithImages = await attachBlogImages(savedBlog);

      return response.json(blogWithImages);
    } catch (error) {
      console.error("Failed to update blog:", error);

      return response.status(500).json({
        message: "Failed to update blog post.",
      });
    }
  }
);

app.delete("/api/blogs/:id", requireAuth, validateIdParam, async function deleteBlog(
  request,
  response
) {
  try {
    const { id } = request.params;

    const existingBlog = await get("SELECT * FROM blogs WHERE id = ?", [id]);

    if (!existingBlog) {
      return response.status(404).json({
        message: "Blog post not found.",
      });
    }

    const blogImages = await getBlogImages(id);

    await run("DELETE FROM blog_images WHERE blog_id = ?", [id]);
    await run("DELETE FROM blogs WHERE id = ?", [id]);

    const filesToDelete = new Set();

    if (existingBlog.image) {
      filesToDelete.add(existingBlog.image);
    }

    for (const blogImage of blogImages) {
      if (blogImage.image) {
        filesToDelete.add(blogImage.image);
      }
    }

    filesToDelete.forEach((filename) => safeDeleteFile(filename));

    return response.json({
      message: "Blog post deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete blog:", error);

    return response.status(500).json({
      message: "Failed to delete blog post.",
    });
  }
});

/* =========================================================
   PROJECT ROUTES
   Supports:
   - image: one cover image
   - images: multiple gallery images
   - videos: multiple project videos
   - video: legacy single video field
   ========================================================= */

app.get("/api/admin/projects", requireAuth, async function getAdminProjects(
  request,
  response
) {
  try {
    const projects = await all(`
      SELECT *
      FROM projects
      ORDER BY
        featured DESC,
        created_at DESC,
        id DESC
    `);

    const projectsWithMedia = await Promise.all(projects.map(attachProjectMedia));

    return response.json(projectsWithMedia);
  } catch (error) {
    console.error("Failed to fetch admin projects:", error);

    return response.status(500).json({
      message: "Failed to fetch projects.",
    });
  }
});

app.get("/api/projects", validateListQuery(["category", "featured"]), async function getProjects(request, response) {
  try {
    const { category, featured } = request.query;

    const params = [];

    let sql = `
      SELECT *
      FROM projects
      WHERE published = 1
    `;

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (featured === "1" || featured === "true") {
      sql += " AND featured = 1";
    }

    sql += `
      ORDER BY
        featured DESC,
        created_at DESC,
        id DESC
    `;

    const projects = await all(sql, params);
    const projectsWithMedia = await Promise.all(projects.map(attachProjectMedia));

    setPublicDataCache(response);
    return response.json(projectsWithMedia);
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return response.status(500).json({
      message: "Failed to fetch projects.",
    });
  }
});

app.get("/api/projects/:id", validateIdParam, async function getProjectById(request, response) {
  try {
    const { id } = request.params;

    const project = await get(
      `
      SELECT *
      FROM projects
      WHERE id = ? AND published = 1
      `,
      [id]
    );

    if (!project) {
      return response.status(404).json({
        message: "Project not found.",
      });
    }

    const projectWithMedia = await attachProjectMedia(project);

    setPublicDataCache(response);
    return response.json(projectWithMedia);
  } catch (error) {
    console.error("Failed to fetch project:", error);

    return response.status(500).json({
      message: "Failed to fetch project.",
    });
  }
});

app.post(
  "/api/projects",
  requireAuth,
  projectUploadFields,
  verifyAndStoreUploadedFiles,
  optimizeRequestImages,
  validateProjectRequest(false),
  async function createProject(request, response) {
    try {
      const {
        title,
        description,
        category,
        technologies,
        github_url,
        live_url,
        featured,
        published,
      } = request.body;

      if (!title || !description || !category) {
        return response.status(400).json({
          message: "Title, description, and category are required.",
        });
      }

      const coverImageFile = request.files?.image?.[0] || null;
      const galleryImageFiles = request.files?.images || [];
      const videoFiles = [
        ...(request.files?.videos || []),
        ...(request.files?.video || []),
      ];

      const image = coverImageFile?.filename || null;
      const video = videoFiles[0]?.filename || null;

      const result = await run(
        `
        INSERT INTO projects
        (
          title,
          description,
          image,
          video,
          category,
          technologies,
          github_url,
          live_url,
          featured,
          published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title,
          description,
          image,
          video,
          category,
          technologies || "",
          github_url || "",
          live_url || "",
          toFeaturedValue(featured, 0),
          toPublishedValue(published, 1),
        ]
      );

      for (const file of galleryImageFiles) {
        await run(
          `
          INSERT INTO project_images (project_id, image)
          VALUES (?, ?)
          `,
          [result.id, file.filename]
        );
      }

      for (const file of videoFiles) {
        await run(
          `
          INSERT INTO project_videos (project_id, video)
          VALUES (?, ?)
          `,
          [result.id, file.filename]
        );
      }

      const createdProject = await get("SELECT * FROM projects WHERE id = ?", [
        result.id,
      ]);

      const projectWithMedia = await attachProjectMedia(createdProject);

      return response.status(201).json(projectWithMedia);
    } catch (error) {
      console.error("Failed to create project:", error);

      return response.status(500).json({
        message: "Failed to create project.",
      });
    }
  }
);

app.put(
  "/api/projects/:id",
  requireAuth,
  validateIdParam,
  projectUploadFields,
  verifyAndStoreUploadedFiles,
  optimizeRequestImages,
  validateProjectRequest(true),
  async function updateProject(request, response) {
    try {
      const { id } = request.params;

      const existingProject = await get("SELECT * FROM projects WHERE id = ?", [
        id,
      ]);

      if (!existingProject) {
        return response.status(404).json({
          message: "Project not found.",
        });
      }

      const coverImageFile = request.files?.image?.[0] || null;
      const galleryImageFiles = request.files?.images || [];
      const videoFiles = [
        ...(request.files?.videos || []),
        ...(request.files?.video || []),
      ];

      const image = coverImageFile?.filename || existingProject.image;
      const video = videoFiles[0]?.filename || existingProject.video;

      const updatedProject = {
        title: request.body.title ?? existingProject.title,
        description: request.body.description ?? existingProject.description,
        image,
        video,
        category: request.body.category ?? existingProject.category,
        technologies: request.body.technologies ?? existingProject.technologies,
        github_url: request.body.github_url ?? existingProject.github_url,
        live_url: request.body.live_url ?? existingProject.live_url,
        featured: toFeaturedValue(request.body.featured, existingProject.featured),
        published: toPublishedValue(
          request.body.published,
          existingProject.published
        ),
      };

      await run(
        `
        UPDATE projects
        SET
          title = ?,
          description = ?,
          image = ?,
          video = ?,
          category = ?,
          technologies = ?,
          github_url = ?,
          live_url = ?,
          featured = ?,
          published = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          updatedProject.title,
          updatedProject.description,
          updatedProject.image,
          updatedProject.video,
          updatedProject.category,
          updatedProject.technologies,
          updatedProject.github_url,
          updatedProject.live_url,
          updatedProject.featured,
          updatedProject.published,
          id,
        ]
      );

      await run("DELETE FROM project_images WHERE project_id = ? AND image = ?", [
        id,
        updatedProject.image,
      ]);

      for (const file of galleryImageFiles) {
        await run(
          `
          INSERT INTO project_images (project_id, image)
          VALUES (?, ?)
          `,
          [id, file.filename]
        );
      }

      for (const file of videoFiles) {
        await run(
          `
          INSERT INTO project_videos (project_id, video)
          VALUES (?, ?)
          `,
          [id, file.filename]
        );
      }

      const savedProject = await get("SELECT * FROM projects WHERE id = ?", [
        id,
      ]);

      const projectWithMedia = await attachProjectMedia(savedProject);

      return response.json(projectWithMedia);
    } catch (error) {
      console.error("Failed to update project:", error);

      return response.status(500).json({
        message: "Failed to update project.",
      });
    }
  }
);

app.delete("/api/projects/:id", requireAuth, validateIdParam, async function deleteProject(
  request,
  response
) {
  try {
    const { id } = request.params;

    const existingProject = await get("SELECT * FROM projects WHERE id = ?", [
      id,
    ]);

    if (!existingProject) {
      return response.status(404).json({
        message: "Project not found.",
      });
    }

    const projectImages = await getProjectImages(id);
    const projectVideos = await getProjectVideos(id);

    await run("DELETE FROM project_images WHERE project_id = ?", [id]);
    await run("DELETE FROM project_videos WHERE project_id = ?", [id]);
    await run("DELETE FROM projects WHERE id = ?", [id]);

    const filesToDelete = new Set();

    if (existingProject.image) {
      filesToDelete.add(existingProject.image);
    }

    if (existingProject.video) {
      filesToDelete.add(existingProject.video);
    }

    for (const projectImage of projectImages) {
      if (projectImage.image) {
        filesToDelete.add(projectImage.image);
      }
    }

    for (const projectVideo of projectVideos) {
      if (projectVideo.video) {
        filesToDelete.add(projectVideo.video);
      }
    }

    filesToDelete.forEach((filename) => safeDeleteFile(filename));

    return response.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete project:", error);

    return response.status(500).json({
      message: "Failed to delete project.",
    });
  }
});
/* =========================================================
   ANALYTICS ROUTES
   ========================================================= */

app.post("/api/analytics/nav-click", validateAnalyticsRequest, async function trackNavClick(
  request,
  response
) {
  try {
    const {
      label,
      path,
      current_path,
      session_id,
      user_type,
    } = request.body;

    if (!label || !path) {
      return response.status(400).json({
        message: "Label and path are required.",
      });
    }

    await run(
      `
      INSERT INTO nav_clicks
      (
        label,
        path,
        current_path,
        session_id,
        user_type
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        label,
        path,
        current_path || "",
        session_id || "",
        user_type || "visitor",
      ]
    );

    return response.status(201).json({
      message: "Navigation click tracked.",
    });
  } catch (error) {
    console.error("Failed to track navigation click:", error);

    return response.status(500).json({
      message: "Failed to track navigation click.",
    });
  }
});

app.get("/api/admin/analytics/nav-clicks", requireAuth, async function getNavClicks(
  request,
  response
) {
  try {
    const clicks = await all(`
      SELECT
        label,
        path,
        COUNT(*) AS total_clicks
      FROM nav_clicks
      GROUP BY label, path
      ORDER BY total_clicks DESC
    `);

    return response.json(clicks);
  } catch (error) {
    console.error("Failed to fetch navigation analytics:", error);

    return response.status(500).json({
      message: "Failed to fetch navigation analytics.",
    });
  }
});
/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(async function errorHandler(error, request, response, next) {
  await cleanupUploadedFiles(request.files).catch((cleanupError) => {
    console.error("Failed to clean up rejected uploads:", cleanupError);
  });

  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Each upload must be 50 MB or smaller.",
      LIMIT_FILE_COUNT: "No more than 20 files may be uploaded at once.",
      LIMIT_UNEXPECTED_FILE: "An unexpected upload field or too many files were provided.",
    };

    return response.status(400).json({
      message: messages[error.code] || "The upload was rejected.",
    });
  }

  const statusCode = Number(error?.statusCode) || 500;
  if (statusCode >= 500) {
    console.error("Unhandled request error:", error);
  }

  return response.status(statusCode).json({
    message: statusCode >= 500
      ? "An unexpected server error occurred."
      : error.message || "The request was rejected.",
  });
});

/* =========================================================
   START SERVER
   ========================================================= */

async function startServer() {
  try {
    assertSecurityConfiguration();
    await initDb();
    await ensureProjectMediaSchema();

    app.listen(PORT, function listen() {
      console.log(`Adventure Blog API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Hostinger loads the entry file through its own runtime wrapper, so
// `require.main === module` is false in production even for the entry file.
// Keep tests import-safe while always starting the deployed application.
if (process.env.NODE_ENV !== "test") {
  startServer();
}

module.exports = {
  app,
  startServer,
};
