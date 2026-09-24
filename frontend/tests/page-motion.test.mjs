import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../src/lib/pageMotion.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function setup(reduced = false) {
  const intersections = [];
  const mutations = [];
  const listeners = new Set();
  const animations = [];
  class Element {
    constructor(top = 1000, children = []) { this.top = top; this.children = children; }
    matches() { return !this.isRoot; }
    querySelectorAll() { return this.children; }
    getBoundingClientRect() { return { top: this.top }; }
    contains(element) { return element === this; }
    animate() {
      const animation = { cancelled: false, cancel() { this.cancelled = true; this.oncancel?.(); } };
      animations.push(animation);
      return animation;
    }
  }
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); intersections.push(this); }
    observe(element) { this.targets.add(element); }
    unobserve(element) { this.targets.delete(element); }
    disconnect() { this.disconnected = true; this.targets.clear(); }
    enter(element) { if (this.targets.has(element)) this.callback([{ target: element, isIntersecting: true }]); }
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; mutations.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const preference = {
    matches: reduced,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  const document = { activeElement: null };
  const exports = {};
  const window = { innerHeight: 800, IntersectionObserver, matchMedia: () => preference };
  runInNewContext(source, { exports, Element, window, document, IntersectionObserver, MutationObserver });
  const visible = new Element(50);
  const below = new Element(1100);
  const root = new Element(0, [visible, below]);
  root.isRoot = true;
  return {
    ...exports, root, visible, below, Element, document, window,
    intersections, mutations, listeners, animations,
    setReduced(value) { preference.matches = value; listeners.forEach((listener) => listener()); },
  };
}

test("initial content stays still; offscreen cards animate only once", () => {
  const env = setup();
  const cleanup = env.observePageMotion(env.root);
  const observer = env.intersections[0];
  assert.equal(observer.targets.has(env.visible), false);
  assert.equal(observer.targets.has(env.below), true);
  observer.enter(env.below);
  observer.enter(env.below);
  assert.equal(env.animations.length, 1);
  cleanup();
});

test("reduced motion disables observation and cancels running effects when changed", () => {
  const env = setup(true);
  const cleanup = env.observePageMotion(env.root);
  assert.equal(env.intersections.length, 0);
  env.setReduced(false);
  env.intersections[0].enter(env.below);
  env.setReduced(true);
  assert.equal(env.animations[0].cancelled, true);
  assert.equal(env.intersections[0].disconnected, true);
  assert.equal(env.mutations[0].disconnected, true);
  cleanup();
  assert.equal(env.listeners.size, 0);
});

test("asynchronous cards are observed, focused content stays still, and navigation cleans up", () => {
  const env = setup();
  const cleanup = env.observePageMotion(env.root);
  const card = new env.Element();
  env.mutations[0].callback([{ addedNodes: [card] }]);
  assert.equal(env.intersections[0].targets.has(card), true);
  env.document.activeElement = card;
  env.intersections[0].enter(card);
  assert.equal(env.animations.length, 0);
  env.intersections[0].enter(env.below);
  cleanup();
  assert.equal(env.animations[0].cancelled, true);
  assert.equal(env.intersections[0].disconnected, true);
  assert.equal(env.mutations[0].disconnected, true);
  assert.equal(env.listeners.size, 0);
});

test("unsupported browsers keep content available without installing observers", () => {
  const env = setup();
  delete env.window.IntersectionObserver;
  env.observePageMotion(env.root)();
  assert.equal(env.intersections.length, 0);
  assert.equal(env.listeners.size, 0);
});
