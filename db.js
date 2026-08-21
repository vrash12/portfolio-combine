// backend/db.js

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "portfolio_db";

let pool;

function escapeDatabaseName(databaseName) {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(
      "Invalid DB_NAME. Use letters, numbers, and underscores only."
    );
  }

  return `\`${databaseName}\``;
}

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: false,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeDatabaseName(
        DB_NAME
      )} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function getPool() {
  if (pool) return pool;

  await ensureDatabaseExists();

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });

  return pool;
}

async function run(sql, params = []) {
  const database = await getPool();
  const [result] = await database.execute(sql, params);

  return {
    id: result.insertId || 0,
    changes: result.affectedRows || 0,
  };
}

async function get(sql, params = []) {
  const database = await getPool();
  const [rows] = await database.execute(sql, params);

  return rows[0];
}

async function all(sql, params = []) {
  const database = await getPool();
  const [rows] = await database.execute(sql, params);

  return rows;
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      body LONGTEXT NOT NULL,
      image VARCHAR(255),
      tags TEXT,
      category VARCHAR(100) DEFAULT '',
      location VARCHAR(255) DEFAULT '',
      adventure_date DATE NULL,
      published TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS blog_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      blog_id INT NOT NULL,
      image VARCHAR(255) NOT NULL,
      caption VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_blog_images_blog
        FOREIGN KEY (blog_id) REFERENCES blogs(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image VARCHAR(255),
      video VARCHAR(255),
      category VARCHAR(100) NOT NULL,
      technologies TEXT,
      github_url TEXT,
      live_url TEXT,
      featured TINYINT(1) DEFAULT 0,
      published TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

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

  const existingProjects = await get("SELECT COUNT(*) AS count FROM projects");

  if (Number(existingProjects.count) === 0) {
    await run(
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
        "Portfolio Adventure Blog",
        "A React + TypeScript portfolio with a Node.js backend, login system, project showcase, image uploads, and video previews.",
        null,
        null,
        "Software Development",
        "React, TypeScript, Node.js, Express, MySQL",
        "",
        "",
        1,
        1,
      ]
    );

    await run(
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
        "Data Analysis Dashboard",
        "A data-focused project for cleaning, analyzing, visualizing, and presenting structured data.",
        null,
        null,
        "Data Science",
        "Python, Pandas, Charts, Data Visualization",
        "",
        "",
        1,
        1,
      ]
    );
    await run(`
  CREATE TABLE IF NOT EXISTS nav_clicks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    current_path VARCHAR(255) DEFAULT '',
    session_id VARCHAR(255) DEFAULT '',
    user_type VARCHAR(50) DEFAULT 'visitor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

    await run(
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
        "AI Automation Experiment",
        "An experiment exploring practical artificial intelligence workflows, automation, and intelligent systems.",
        null,
        null,
        "Artificial Intelligence",
        "Python, TensorFlow, AI Tools, Automation",
        "",
        "",
        1,
        1,
      ]
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const existingAdmin = await get("SELECT * FROM users WHERE email = ?", [
    adminEmail,
  ]);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await run(
      `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
      `,
      [adminName, adminEmail, hashedPassword, "admin"]
    );

    console.log(`Admin user created: ${adminEmail}`);
  }

  const existingBlogs = await get("SELECT COUNT(*) AS count FROM blogs");

  if (Number(existingBlogs.count) === 0) {
    await run(
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
        "My First Hiking Story",
        "A short reflection from one of my outdoor adventures.",
        `
          <p>This is a sample hiking blog post.</p>
          <p>You can replace this with your real hiking adventure story.</p>
        `,
        null,
        "Hiking, Adventure, Travel",
        "Hiking",
        "Philippines",
        "2026-07-01",
        1,
      ]
    );

    await run(
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
        "A Motorcycle Ride Worth Remembering",
        "A personal story from the road, the ride, and the places along the way.",
        `
          <p>This is a sample motorcycle blog post.</p>
          <p>Write about your route, stops, road conditions, and favorite moments.</p>
        `,
        null,
        "Motorcycle, Ride, Adventure",
        "Motorcycle",
        "Philippines",
        "2026-07-02",
        1,
      ]
    );

    await run(
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
        "A Travel Day I Want to Remember",
        "A simple travel entry about places, people, and moments.",
        `
          <p>This is a sample travel blog post.</p>
          <p>Add your travel photos, itinerary, food stops, and reflections here.</p>
        `,
        null,
        "Travel, Adventure, Personal",
        "Travel",
        "Philippines",
        "2026-07-03",
        1,
      ]
    );
  }
}

module.exports = {
  getPool,
  run,
  get,
  all,
  initDb,
};