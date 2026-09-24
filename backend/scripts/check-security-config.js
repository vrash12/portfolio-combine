require("dotenv").config({ quiet: true });

const { assertSecurityConfiguration } = require("../auth-config");

function requireValue(name) {
  if (!(process.env[name] || "").trim()) {
    throw new Error(`${name} is required.`);
  }
}

try {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("NODE_ENV must be set to production before deployment.");
  }

  assertSecurityConfiguration();

  for (const name of ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]) {
    requireValue(name);
  }

  const frontend = new URL(process.env.FRONTEND_URL);
  if (process.env.NODE_ENV === "production" && frontend.protocol !== "https:") {
    throw new Error("Production FRONTEND_URL must use HTTPS.");
  }

  console.log("Security configuration is ready for deployment.");
} catch (error) {
  console.error(`Security configuration failed: ${error.message}`);
  process.exitCode = 1;
}
