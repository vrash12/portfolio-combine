const jwt = require("jsonwebtoken");

function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  console.log("Authorization header:", authHeader ? "Found" : "Missing");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      message: "Unauthorized. Missing Bearer token.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    request.user = decoded;

    next();
  } catch (error) {
    console.error("JWT verify error:", error.message);

    return response.status(401).json({
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
}

module.exports = {
  requireAuth,
};