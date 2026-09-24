const revealSelector = [
  ".mission-card", ".flagship-card", ".home-blog-card",
  ".about-summary-card", ".about-summary-approach", ".about-summary-tool-note",
  ".education-card", ".education-honors", ".about-skill-card", ".about-skills-workflow",
  ".about-experience-card",
  ".project-card", ".project-detail-story-card", ".project-detail-tech-card",
  ".project-case-study-section", ".project-detail-gallery-item",
  ".adventure-gallery-item",
].join(",");

/** Content stays visible if motion is disabled or observers are unavailable. */
export function observePageMotion(root: HTMLElement) {
  if (!("IntersectionObserver" in window) || !Element.prototype.animate) {
    return () => {};
  }

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let stopObserving = () => {};

  function updatePreference() {
    stopObserving();
    if (preference.matches) return;

    const registered = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      let stagger = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);

        // Never animate a field or link while someone is interacting with it.
        if (entry.target.contains(document.activeElement)) continue;
        const animation = entry.target.animate(
          [{ opacity: 0.65, translate: "0 12px" }, { opacity: 1, translate: "0 0" }],
          { duration: 380, delay: (stagger++ % 3) * 45,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        animations.add(animation);
        animation.onfinish = animation.oncancel = () => animations.delete(animation);
      }
    }, { threshold: 0.05 });

    function register(element: Element) {
      if (registered.has(element)) return;
      registered.add(element);
      const bounds = element.getBoundingClientRect();
      // Leave the initial viewport and restored scroll position undisturbed.
      if (bounds.top < window.innerHeight) return;
      observer.observe(element);
    }

    function scan(element: Element) {
      if (element.matches(revealSelector)) register(element);
      element.querySelectorAll(revealSelector).forEach(register);
    }

    scan(root);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
      }
    });
    // Include asynchronous project/blog results without polling the page.
    mutations.observe(root, { childList: true, subtree: true });

    stopObserving = () => {
      observer.disconnect();
      mutations.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
  }

  updatePreference();
  preference.addEventListener("change", updatePreference);
  return () => {
    preference.removeEventListener("change", updatePreference);
    stopObserving();
  };
}
