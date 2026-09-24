const sanitizeHtml = require("sanitize-html");

class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestValidationError";
    this.statusCode = 400;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertObject(value) {
  if (!isPlainObject(value)) {
    throw new RequestValidationError("The request body must be an object.");
  }
}

function assertAllowedKeys(value, allowedKeys) {
  assertObject(value);
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));

  if (unexpected.length > 0) {
    throw new RequestValidationError(
      `Unexpected field${unexpected.length === 1 ? "" : "s"}: ${unexpected.join(", ")}.`
    );
  }
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function text(value, label, options = {}) {
  const {
    allowEmpty = false,
    max = 255,
    min = allowEmpty ? 0 : 1,
  } = options;

  if (typeof value !== "string") {
    throw new RequestValidationError(`${label} must be text.`);
  }

  const normalized = value.trim();

  if (!allowEmpty && normalized.length === 0) {
    throw new RequestValidationError(`${label} is required.`);
  }

  if (normalized.length < min || normalized.length > max) {
    throw new RequestValidationError(
      `${label} must contain between ${min} and ${max} characters.`
    );
  }

  return normalized;
}

function booleanValue(value, label) {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return 1;
  }

  if (value === false || value === 0 || value === "0" || value === "false") {
    return 0;
  }

  throw new RequestValidationError(`${label} must be true or false.`);
}

function optionalUrl(value, label) {
  const normalized = text(value, label, { allowEmpty: true, max: 2048 });
  if (!normalized) return "";

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new RequestValidationError(`${label} must be a valid URL.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new RequestValidationError(`${label} must use HTTP or HTTPS.`);
  }

  return parsed.href;
}

function optionalDate(value) {
  if (value === "" || value === null) return null;

  const normalized = text(value, "Adventure date", { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new RequestValidationError("Adventure date must use YYYY-MM-DD.");
  }

  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new RequestValidationError("Adventure date is invalid.");
  }

  return normalized;
}

function sanitizeBlogBody(value) {
  const normalized = text(value, "Body", { max: 200_000 });
  const sanitized = sanitizeHtml(normalized, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
      "ul", "ol", "li", "h2", "h3", "h4", "a", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
    disallowedTagsMode: "discard",
  });

  const readableText = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!readableText) {
    throw new RequestValidationError("Body must contain readable text.");
  }

  return sanitized;
}

function validateLoginBody(body) {
  assertAllowedKeys(body, ["email", "password", "otp"]);

  const email = text(body.email, "Email", { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError("Email is invalid.");
  }

  const password = text(body.password, "Password", { max: 256 });
  let otp = "";

  if (hasOwn(body, "otp") && body.otp !== "") {
    otp = text(body.otp, "Authenticator code", { max: 6 });
    if (!/^\d{6}$/.test(otp)) {
      throw new RequestValidationError("Authenticator code must contain six digits.");
    }
  }

  return { email, password, otp };
}

function validateBlogBody(body, options = {}) {
  const partial = Boolean(options.partial);
  const fields = [
    "title", "description", "body", "tags", "category", "location",
    "adventure_date", "published",
  ];
  assertAllowedKeys(body, fields);

  const output = {};
  const required = partial ? [] : ["title", "description", "body"];
  for (const key of required) {
    if (!hasOwn(body, key)) throw new RequestValidationError(`${key} is required.`);
  }

  if (hasOwn(body, "title")) output.title = text(body.title, "Title", { max: 180 });
  if (hasOwn(body, "description")) output.description = text(body.description, "Description", { max: 1000 });
  if (hasOwn(body, "body")) output.body = sanitizeBlogBody(body.body);
  if (hasOwn(body, "tags")) output.tags = text(body.tags, "Tags", { allowEmpty: true, max: 1000 });
  if (hasOwn(body, "category")) output.category = text(body.category, "Category", { allowEmpty: true, max: 100 });
  if (hasOwn(body, "location")) output.location = text(body.location, "Location", { allowEmpty: true, max: 255 });
  if (hasOwn(body, "adventure_date")) output.adventure_date = optionalDate(body.adventure_date);
  if (hasOwn(body, "published")) output.published = booleanValue(body.published, "Published");

  return output;
}

function validateProjectBody(body, options = {}) {
  const partial = Boolean(options.partial);
  const fields = [
    "title", "description", "category", "technologies", "github_url",
    "live_url", "featured", "published",
  ];
  assertAllowedKeys(body, fields);

  const output = {};
  const required = partial ? [] : ["title", "description", "category"];
  for (const key of required) {
    if (!hasOwn(body, key)) throw new RequestValidationError(`${key} is required.`);
  }

  if (hasOwn(body, "title")) output.title = text(body.title, "Title", { max: 180 });
  if (hasOwn(body, "description")) output.description = text(body.description, "Description", { max: 5000 });
  if (hasOwn(body, "category")) output.category = text(body.category, "Category", { max: 100 });
  if (hasOwn(body, "technologies")) output.technologies = text(body.technologies, "Technologies", { allowEmpty: true, max: 2000 });
  if (hasOwn(body, "github_url")) output.github_url = optionalUrl(body.github_url, "GitHub URL");
  if (hasOwn(body, "live_url")) output.live_url = optionalUrl(body.live_url, "Live URL");
  if (hasOwn(body, "featured")) output.featured = booleanValue(body.featured, "Featured");
  if (hasOwn(body, "published")) output.published = booleanValue(body.published, "Published");

  return output;
}

function validateAnalyticsBody(body) {
  assertAllowedKeys(body, ["label", "path", "current_path", "session_id", "user_type"]);

  return {
    label: text(body.label, "Label", { max: 100 }),
    path: text(body.path, "Path", { max: 255 }),
    current_path: hasOwn(body, "current_path") ? text(body.current_path, "Current path", { allowEmpty: true, max: 255 }) : "",
    session_id: hasOwn(body, "session_id") ? text(body.session_id, "Session ID", { allowEmpty: true, max: 100 }) : "",
    user_type: hasOwn(body, "user_type") ? text(body.user_type, "User type", { allowEmpty: true, max: 50 }) : "visitor",
  };
}

function validateIdParam(request, response, next) {
  if (!/^\d+$/.test(request.params.id || "") || Number(request.params.id) < 1) {
    return next(new RequestValidationError("The resource identifier is invalid."));
  }

  request.params.id = String(Number(request.params.id));
  next();
}

module.exports = {
  RequestValidationError,
  sanitizeBlogBody,
  validateAnalyticsBody,
  validateBlogBody,
  validateIdParam,
  validateLoginBody,
  validateProjectBody,
};
