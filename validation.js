const sanitizeHtml = require("sanitize-html");

class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestValidationError";
    this.statusCode = 400;
  }
}

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object || {}, key);

function ensureRequestObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("The request body must be an object.");
  }

  return value;
}

function assertAllowedKeys(object, allowedKeys) {
  const unknownKey = Object.keys(object).find(
    (key) => !allowedKeys.includes(key)
  );

  if (unknownKey) {
    throw new RequestValidationError(
      `Unsupported request field: ${unknownKey}.`
    );
  }
}

function normalizeText(value, label, options = {}) {
  const {
    allowEmpty = true,
    maxLength = 255,
    minLength = 0,
    trim = true,
  } = options;

  if (typeof value !== "string") {
    throw new RequestValidationError(`${label} must be text.`);
  }

  const normalized = trim ? value.trim() : value;

  if (
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)
  ) {
    throw new RequestValidationError(
      `${label} contains unsupported control characters.`
    );
  }

  if (!allowEmpty && normalized.length === 0) {
    throw new RequestValidationError(`${label} is required.`);
  }

  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new RequestValidationError(
      `${label} must contain between ${minLength} and ${maxLength} characters.`
    );
  }

  return normalized;
}

function readText(body, key, label, options = {}) {
  const { partial = false, required = false, ...textOptions } = options;

  if (!hasOwn(body, key)) {
    if (required && !partial) {
      throw new RequestValidationError(`${label} is required.`);
    }

    return undefined;
  }

  return normalizeText(body[key], label, {
    ...textOptions,
    allowEmpty: required ? false : textOptions.allowEmpty,
  });
}

function normalizeBoolean(value, label) {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return 1;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return 0;
  }

  throw new RequestValidationError(`${label} must be true or false.`);
}

function readBoolean(body, key, label, fallback) {
  if (!hasOwn(body, key)) return fallback;

  return normalizeBoolean(body[key], label);
}

function normalizeDate(value, label) {
  const normalized = normalizeText(value, label, { maxLength: 10 });

  if (normalized === "") return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new RequestValidationError(`${label} must use YYYY-MM-DD.`);
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new RequestValidationError(`${label} must be a valid date.`);
  }

  return normalized;
}

function normalizeUrl(value, label) {
  const normalized = normalizeText(value, label, { maxLength: 2048 });

  if (normalized === "") return "";

  let parsed;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new RequestValidationError(`${label} must be a valid URL.`);
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  ) {
    throw new RequestValidationError(
      `${label} must be an HTTP(S) URL without embedded credentials.`
    );
  }

  return parsed.toString();
}

function sanitizeBlogBody(value) {
  const normalized = normalizeText(value, "Blog body", {
    allowEmpty: false,
    maxLength: 100000,
    minLength: 1,
  });

  const sanitized = sanitizeHtml(normalized, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "hr",
      "div",
      "span",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
      }),
    },
  }).trim();

  if (!sanitized) {
    throw new RequestValidationError(
      "Blog body does not contain any permitted content."
    );
  }

  return sanitized;
}

function validateId(value, label = "Identifier") {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) {
    throw new RequestValidationError(`${label} must be a positive integer.`);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id)) {
    throw new RequestValidationError(`${label} is outside the allowed range.`);
  }

  return id;
}

function validateIdParam(request, response, next) {
  try {
    request.validatedId = validateId(request.params.id);
    next();
  } catch (error) {
    next(error);
  }
}

function validateLoginBody(body) {
  const input = ensureRequestObject(body);
  assertAllowedKeys(input, ["email", "password", "otp"]);
  const email = normalizeText(input.email, "Email", {
    allowEmpty: false,
    maxLength: 254,
    minLength: 3,
  }).toLowerCase();
  const password = normalizeText(input.password, "Password", {
    allowEmpty: false,
    maxLength: 256,
    minLength: 1,
    trim: false,
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError("Email must be valid.");
  }

  let otp = "";

  if (hasOwn(input, "otp") && input.otp !== "") {
    otp = normalizeText(input.otp, "Authenticator code", {
      allowEmpty: true,
      maxLength: 8,
    }).replace(/\s+/g, "");

    if (!/^\d{6}$/.test(otp)) {
      throw new RequestValidationError(
        "Authenticator code must contain six digits."
      );
    }
  }

  return { email, password, otp };
}

function validateBlogBody(body, options = {}) {
  const input = ensureRequestObject(body);
  assertAllowedKeys(input, [
    "title",
    "description",
    "body",
    "tags",
    "category",
    "location",
    "adventure_date",
    "published",
  ]);
  const partial = Boolean(options.partial);
  const output = {
    title: readText(input, "title", "Title", {
      partial,
      required: true,
      maxLength: 200,
      minLength: 1,
    }),
    description: readText(input, "description", "Description", {
      partial,
      required: true,
      maxLength: 2000,
      minLength: 1,
    }),
    tags: readText(input, "tags", "Tags", { partial, maxLength: 500 }),
    category: readText(input, "category", "Category", {
      partial,
      maxLength: 100,
    }),
    location: readText(input, "location", "Location", {
      partial,
      maxLength: 200,
    }),
    published: readBoolean(input, "published", "Published", undefined),
  };

  if (hasOwn(input, "body")) {
    output.body = sanitizeBlogBody(input.body);
  } else if (!partial) {
    throw new RequestValidationError("Blog body is required.");
  }

  if (hasOwn(input, "adventure_date")) {
    output.adventure_date = normalizeDate(
      input.adventure_date,
      "Adventure date"
    );
  }

  return output;
}

function validateProjectBody(body, options = {}) {
  const input = ensureRequestObject(body);
  assertAllowedKeys(input, [
    "title",
    "description",
    "category",
    "technologies",
    "github_url",
    "live_url",
    "featured",
    "published",
  ]);
  const partial = Boolean(options.partial);
  const output = {
    title: readText(input, "title", "Title", {
      partial,
      required: true,
      maxLength: 200,
      minLength: 1,
    }),
    description: readText(input, "description", "Description", {
      partial,
      required: true,
      maxLength: 10000,
      minLength: 1,
    }),
    category: readText(input, "category", "Category", {
      partial,
      required: true,
      maxLength: 100,
      minLength: 1,
    }),
    technologies: readText(input, "technologies", "Technologies", {
      partial,
      maxLength: 1000,
    }),
    featured: readBoolean(input, "featured", "Featured", undefined),
    published: readBoolean(input, "published", "Published", undefined),
  };

  for (const [key, label] of [
    ["github_url", "GitHub URL"],
    ["live_url", "Live URL"],
  ]) {
    if (hasOwn(input, key)) {
      output[key] = normalizeUrl(input[key], label);
    }
  }

  return output;
}

function validateListFilter(value, label) {
  if (value === undefined) return undefined;

  return normalizeText(value, label, {
    allowEmpty: false,
    maxLength: 100,
    minLength: 1,
  });
}

function validateAnalyticsBody(body) {
  const input = ensureRequestObject(body);
  assertAllowedKeys(input, ["label", "path", "current_path", "session_id"]);
  const label = normalizeText(input.label, "Label", {
    allowEmpty: false,
    maxLength: 80,
    minLength: 1,
  });
  const path = normalizeText(input.path, "Path", {
    allowEmpty: false,
    maxLength: 500,
    minLength: 1,
  });
  const currentPath = hasOwn(input, "current_path")
    ? normalizeText(input.current_path, "Current path", { maxLength: 500 })
    : "";
  const sessionId = hasOwn(input, "session_id")
    ? normalizeText(input.session_id, "Session identifier", { maxLength: 64 })
    : "";

  if (!path.startsWith("/") || (currentPath && !currentPath.startsWith("/"))) {
    throw new RequestValidationError("Navigation paths must be site paths.");
  }

  if (
    sessionId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId
    )
  ) {
    throw new RequestValidationError("Session identifier must be a UUID.");
  }

  return {
    label,
    path,
    current_path: currentPath,
    session_id: sessionId,
  };
}

module.exports = {
  RequestValidationError,
  validateAnalyticsBody,
  validateBlogBody,
  validateId,
  validateIdParam,
  validateListFilter,
  validateLoginBody,
  validateProjectBody,
};
