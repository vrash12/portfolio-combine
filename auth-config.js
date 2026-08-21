const SESSION_ISSUER = "vrms-portfolio-api";
const SESSION_AUDIENCE = "vrms-portfolio-admin";
const IS_PRODUCTION =
  process.env.NODE_ENV === "production" ||
  (process.env.FRONTEND_URL || "").startsWith("https://");

const configuredSessionMinutes = Number(
  process.env.SESSION_TTL_MINUTES || 120
);

const SESSION_TTL_MINUTES = Number.isInteger(configuredSessionMinutes)
  ? Math.min(480, Math.max(15, configuredSessionMinutes))
  : 120;

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ||
  (IS_PRODUCTION ? "__Host-vrms_session" : "vrms_session");

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MINUTES * 60 * 1000,
  };
}

function getClearSessionCookieOptions() {
  const { httpOnly, secure, sameSite, path } = getSessionCookieOptions();

  return {
    httpOnly,
    secure,
    sameSite,
    path,
  };
}

function assertSecurityConfiguration() {
  const jwtSecret = process.env.JWT_SECRET || "";
  const mfaSecret = (process.env.ADMIN_MFA_SECRET || "")
    .replace(/\s+/g, "")
    .toUpperCase();

  if (jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET is required and must contain at least 32 characters."
    );
  }

  if (
    IS_PRODUCTION &&
    (!SESSION_COOKIE_NAME.startsWith("__Host-") ||
      !getSessionCookieOptions().secure)
  ) {
    throw new Error(
      "Production sessions must use a Secure __Host- cookie name."
    );
  }

  if (mfaSecret && (mfaSecret.length < 16 || !/^[A-Z2-7]+=*$/.test(mfaSecret))) {
    throw new Error("ADMIN_MFA_SECRET must be a valid base32 TOTP secret.");
  }
}

module.exports = {
  IS_PRODUCTION,
  SESSION_AUDIENCE,
  SESSION_COOKIE_NAME,
  SESSION_ISSUER,
  SESSION_TTL_MINUTES,
  assertSecurityConfiguration,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
};
