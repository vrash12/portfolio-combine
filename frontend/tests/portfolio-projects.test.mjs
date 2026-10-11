import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../src/data/portfolioProjects.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const exports = {};
runInNewContext(source, { exports });
const { mergeCuratedProjects, getCuratedProject } = exports;

test("existing Co Pacific record uses the WordPress rebuild without a duplicate", () => {
  const unrelated = { id: 17, title: "CTS Pacific", category: "Software Development" };
  const projects = mergeCuratedProjects([
    unrelated,
    { id: 12, title: "Copacific Website", technologies: "HTML, Javascript, CSS", live_url: "https://copacific.org/index.html", created_at: "2026-07-08" },
  ]);
  const coPacific = projects.filter((project) => project.title.includes("Co Pacific"));
  assert.equal(coPacific.length, 1);
  assert.equal(coPacific[0].id, 12);
  assert.equal(coPacific[0].live_url, "https://copacific.org/");
  assert.match(coPacific[0].technologies, /WordPress.*Yoast SEO/);
  assert.equal(coPacific[0].images.length, 5);
  assert.equal(coPacific[0].created_at, "2026-07-08");
  assert.equal(projects[0], unrelated);
  assert.equal(projects.filter((project) => project.title === "FitQuest").length, 1);
});

test("legacy and curated Co Pacific records collapse into the same canonical project", () => {
  const projects = mergeCuratedProjects([
    { id: 12, title: "Copacific Website" },
    { id: 9004, title: "Co Pacific Distributors" },
  ]);
  assert.equal(projects.filter((project) => project.id === 12).length, 1);
  assert.equal(projects.some((project) => project.id === 9004), false);
  assert.equal(getCuratedProject("9004"), getCuratedProject("12"));
});

test("the refreshed project remains available with an empty API response", () => {
  const projects = mergeCuratedProjects([]);
  assert.equal(projects.filter((project) => project.id === 12).length, 1);
  assert.ok(getCuratedProject("12").images.every((image) => image.project_id === 12));
});
