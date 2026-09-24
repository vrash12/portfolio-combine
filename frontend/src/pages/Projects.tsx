import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Project } from "../types";
import ProjectCard from "../components/ProjectCard";
import { getPreferredProjectDescription } from "../data/projectCaseStudies";

function formatDate(date?: string | null) {
  if (!date) return "Recently added";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get<Project[]>("/projects")
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch projects:", error);
        setErrorMessage("Failed to load projects. Please check your backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        projects
          .map((project) => project.category)
          .filter((category): category is string => Boolean(category))
      )
    );

    return ["All", ...uniqueCategories];
  }, [projects]);

  const filteredProjects =
    selectedCategory === "All"
      ? projects
      : projects.filter((project) => project.category === selectedCategory);

  const featuredCount = useMemo(() => {
    return projects.filter((project) => project.featured === 1).length;
  }, [projects]);

  const categoryStats = useMemo(() => {
    const counts = projects.reduce<Record<string, number>>((accumulator, project) => {
      const key = project.category || "Uncategorized";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [projects]);

  const highlightedProject = useMemo(() => {
    if (projects.length === 0) return null;

    const featuredProject = projects.find((project) => project.featured === 1);
    if (featuredProject) return featuredProject;

    const sortedProjects = [...projects].sort((a, b) => {
      const firstDate = new Date(b.created_at || 0).getTime();
      const secondDate = new Date(a.created_at || 0).getTime();
      return firstDate - secondDate;
    });

    return sortedProjects[0] || null;
  }, [projects]);

  return (
    <main className="collection-page">
      <section className="collection-hero projects-collection-hero">
        <div className="collection-hero-pattern" aria-hidden="true">
          <span className="collection-plus plus-one">+</span>
          <span className="collection-plus plus-two">+</span>
          <span className="collection-plus plus-three">+</span>
          <span className="collection-orbit orbit-one" />
          <span className="collection-orbit orbit-two" />
        </div>

        <div className="collection-hero-layout">
          <div className="collection-hero-copy">
            <p className="section-kicker">Build Archive</p>

            <h1>Projects that turn ideas into useful working systems.</h1>

            <p className="collection-hero-description">
              A curated collection of systems, dashboards, experiments, and
              applications I have designed and built across software
              development, automation, and problem-solving.
            </p>

            <div className="collection-chip-row">
              <span>Full-Stack Apps</span>
              <span>Dashboards</span>
              <span>Automation</span>
              <span>Experiments</span>
            </div>

            <div className="collection-stat-grid">
              <article className="collection-stat-card">
                <strong>{projects.length}</strong>
                <span>Total Projects</span>
              </article>

              <article className="collection-stat-card">
                <strong>{featuredCount}</strong>
                <span>Featured Builds</span>
              </article>

              <article className="collection-stat-card">
                <strong>{Math.max(categories.length - 1, 0)}</strong>
                <span>Categories</span>
              </article>
            </div>
          </div>

          <aside className="collection-hero-panel">
            <div className="collection-panel-top">
              <span>Build Snapshot</span>
              <strong>{featuredCount} Featured</strong>
            </div>

            {highlightedProject ? (
              <>
                <p className="collection-panel-label">Highlighted Project</p>

                <h2 className="collection-highlight-title">
                  {highlightedProject.title}
                </h2>

                <p className="collection-highlight-copy">
                  {getPreferredProjectDescription(highlightedProject)}
                </p>

                <div className="collection-highlight-meta">
                  <span>{highlightedProject.category}</span>
                  <span>{formatDate(highlightedProject.created_at)}</span>
                </div>

                {highlightedProject.technologies && (
                  <p className="collection-panel-tech">
                    <strong>Stack:</strong> {highlightedProject.technologies}
                  </p>
                )}

                <Link
                  to={`/projects/${highlightedProject.id}`}
                  className="collection-panel-link"
                >
                  Open Highlight
                </Link>
              </>
            ) : (
              <>
                <p className="collection-panel-label">Build Status</p>
                <h2 className="collection-highlight-title">
                  Projects loading in...
                </h2>
                <p className="collection-highlight-copy">
                  Your latest builds, featured systems, and categories will
                  appear here once the data is available.
                </p>
              </>
            )}

            {categoryStats.length > 0 && (
              <div className="collection-mini-list">
                {categoryStats.map((item) => (
                  <div key={item.name} className="collection-mini-row">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="content-section collection-content-section">
        <div className="collection-filter-panel">
          <div className="collection-filter-top">
            <div className="collection-filter-heading">
              <p className="section-kicker">Filter Projects</p>
              <h2>Explore by category</h2>
              <p>
                Browse my work by type so you can quickly find the projects you
                are most interested in.
              </p>
            </div>

            <div className="collection-filter-summary" aria-live="polite" aria-atomic="true">
              <strong>{filteredProjects.length}</strong>
              <span>
                {selectedCategory === "All"
                  ? "projects shown"
                  : `${selectedCategory} projects`}
              </span>
            </div>
          </div>

          <div className="collection-filter-groups">
            <div className="collection-filter-group">
              <span className="collection-filter-label">Categories</span>

              <div className="tag-filter enhanced-filter">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory === category
                        ? "tag-button active"
                        : "tag-button"
                    }
                    onClick={() => setSelectedCategory(category)}
                    aria-pressed={selectedCategory === category}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="collection-empty-state">
            <p>Loading projects...</p>
          </div>
        ) : errorMessage ? (
          <div className="collection-empty-state">
            <p>{errorMessage}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="collection-empty-state">
            <p>No projects found.</p>
          </div>
        ) : (
          <div className="project-grid">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Projects;
