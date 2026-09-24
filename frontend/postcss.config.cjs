const purgeCss = require("@fullhuman/postcss-purgecss");
const discardDuplicates = require("postcss-discard-duplicates");

module.exports = {
  plugins: [
    discardDuplicates(),
    purgeCss({
      content: ["./index.html", "./src/**/*.{ts,tsx}"],
      safelist: {
        standard: [
          /^gallery-style-/,
          /^project-gallery-style-/,
          /^hero-space-/,
          /^mission-/,
        ],
      },
    }),
  ],
};
