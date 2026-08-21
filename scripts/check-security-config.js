require("dotenv").config({ quiet: true });

const { assertSecurityConfiguration } = require("../auth-config");

const errors = [];

try {
  assertSecurityConfiguration();
} catch (error) {
  errors.push(error.message);
}

for (const name of ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]) {
  if (!process.env[name]) {
    errors.push(`${name} must be configured.`);
  }
}

const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";

if (!process.env.ADMIN_NAME || !adminEmail || !adminPassword) {
  errors.push("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required.");
}

if (adminEmail === "admin@example.com") {
  errors.push("ADMIN_EMAIL must not use the legacy default address.");
}

if (adminPassword.length < 12 || adminPassword === "admin123") {
  errors.push("ADMIN_PASSWORD must be unique and at least 12 characters.");
}

try {
  const frontendUrl = new URL(process.env.FRONTEND_URL || "");

  if (
    frontendUrl.protocol !== "https:" ||
    frontendUrl.pathname !== "/" ||
    frontendUrl.search ||
    frontendUrl.hash ||
    frontendUrl.username ||
    frontendUrl.password
  ) {
    errors.push("FRONTEND_URL must be one exact HTTPS origin.");
  }
} catch {
  errors.push("FRONTEND_URL must be one exact HTTPS origin.");
}

if (errors.length > 0) {
  console.error("Security configuration needs attention:");

  for (const error of [...new Set(errors)]) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log("Security configuration checks passed.");
