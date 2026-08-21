const jwt = require("jsonwebtoken");

const {
  SESSION_AUDIENCE,
  SESSION_COOKIE_NAME,
  SESSION_ISSUER,
  getClearSessionCookieOptions,
} = require("../auth-config");

function readSession(request) {
  const token = request.cookies?.[SESSION_COOKIE_NAME];

  if (!token) return null;

  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    audience: SESSION_AUDIENCE,
    issuer: SESSION_ISSUER,
  });
}

function requireAuth(request, response, next) {
  try {
    const session = readSession(request);

    if (!session) {
      return response.status(401).json({
        message: "Authentication required.",
      });
    }

    request.user = session;
    next();
  } catch {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      getClearSessionCookieOptions()
    );

    return response.status(401).json({
      message: "Your session is invalid or has expired.",
    });
  }
}

function optionalAuth(request, response, next) {
  try {
    request.user = readSession(request);
  } catch {
    request.user = null;
  }

  next();
}

module.exports = {
  optionalAuth,
  requireAuth,
};
