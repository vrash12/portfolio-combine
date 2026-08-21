// backend/server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { initDb, run, get, all } = require("./db");
const { requireAuth } = require("./middleware/auth");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "development_secret_change_this_later";

const uploadDir = path.join(__dirname, "public", "static", "images");

fs.mkdirSync(uploadDir, { recursive: true });

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

app.use("/static/images", express.static(uploadDir));

function safeDeleteFile(filename) {
  if (!filename) return;

  const filePath = path.join(uploadDir, filename);

  fs.unlink(filePath, function removeFile(error) {
    if (error && error.code !== "ENOENT") {
      console.error("Failed to delete uploaded file:", error);
    }
  });
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
    callback(null, uploadDir);
  },

  filename: function filename(request, file, callback) {
    const originalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.-]/g, "");

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1000000000
    )}-${originalName}`;

    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 500,
  },

  fileFilter: function fileFilter(request, file, callback) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        new Error("Only JPG, PNG, WEBP, MP4, WEBM, and MOV files are allowed.")
      );
      return;
    }

    callback(null, true);
  },
});

const projectUploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 50 },
  { name: "video", maxCount: 1 },
  { name: "videos", maxCount: 20 },
]);

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

app.post("/api/auth/login", async function login(request, response) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      return response.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return response.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return response.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return response.status(500).json({
      message: "Login failed.",
    });
  }
});

app.get("/api/auth/me", requireAuth, async function me(request, response) {
  response.json({
    user: request.user,
  });
});

/* =========================================================
   BLOG ROUTES
   ========================================================= */

app.get("/api/blogs", async function getBlogs(request, response) {
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

    return response.json(blogsWithImages);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);

    return response.status(500).json({
      message: "Failed to fetch blogs.",
    });
  }
});

app.get("/api/blogs/:id", async function getBlogById(request, response) {
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
  upload.array("images", 50),
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
  upload.array("images", 50),
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

app.delete("/api/blogs/:id", requireAuth, async function deleteBlog(
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

app.get("/api/projects", async function getProjects(request, response) {
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

    return response.json(projectsWithMedia);
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return response.status(500).json({
      message: "Failed to fetch projects.",
    });
  }
});

app.get("/api/projects/:id", async function getProjectById(request, response) {
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
  projectUploadFields,
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

app.delete("/api/projects/:id", requireAuth, async function deleteProject(
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

app.post("/api/analytics/nav-click", async function trackNavClick(
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

app.use(function errorHandler(error, request, response, next) {
  if (error instanceof multer.MulterError) {
    return response.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return response.status(400).json({
      message: error.message || "Something went wrong.",
    });
  }

  next();
});

/* =========================================================
   START SERVER
   ========================================================= */

async function startServer() {
  try {
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

startServer();