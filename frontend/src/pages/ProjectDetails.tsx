import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  getImageUrl,
  getThumbnailUrl,
} from "../api/client";
import type { Project, ProjectImage } from "../types";
import DeferredVideo from "../components/DeferredVideo";
import pgtResearchPoster from "../assets/projects/pgt-onboard-research-poster.jpg";
import {
  getPreferredProjectDescription,
  getProjectCaseStudy,
  PROJECT_OWNERSHIP_LABEL,
  PROJECT_OWNERSHIP_STATEMENT,
  type ProjectCaseStudy,
} from "../data/projectCaseStudies";

type ProjectVideo = {
  id: number;
  project_id: number;
  video: string;
  caption?: string | null;
  created_at?: string;
};

type ProjectWithMedia = Project & {
  video?: string | null;
  videos?: ProjectVideo[];
};

function formatDate(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type ProjectCaseStudyContentProps = {
  caseStudy: ProjectCaseStudy;
  technologies: string[];
};

type GalleryImage = ProjectImage & { localSrc?: string };

function ProjectCaseStudyContent({
  caseStudy,
  technologies,
}: ProjectCaseStudyContentProps) {
  const displayedTechnologies =
    technologies.length > 0 ? technologies : caseStudy.technologies;

  return (
    <section
      className="project-case-study-section"
      aria-labelledby="project-case-study-title"
    >
      <div className="project-case-study-heading">
        <div>
          <p className="section-kicker">Engineering Case Study</p>
          <h2 id="project-case-study-title">
            From a real problem to a working system.
          </h2>
        </div>

        <div className="project-case-study-result">
          <span>Verified outcome</span>
          <strong>{caseStudy.result}</strong>
          <p>{caseStudy.resultLabel}</p>
        </div>
      </div>

      <div className="project-case-study-narrative">
        <article>
          <span>01 · Business challenge</span>
          <h3>Why it needed to be built</h3>
          <p>{caseStudy.problem}</p>
        </article>

        <article>
          <span>02 · My contribution</span>
          <h3>What I designed and delivered</h3>
          <p>{caseStudy.contribution}</p>
        </article>

        <article className="project-case-study-architecture">
          <span>03 · Architecture</span>
          <h3>How the parts work together</h3>
          <p>{caseStudy.architecture}</p>
        </article>
      </div>

      <div className="project-case-study-capabilities">
        <div className="project-case-study-subheading">
          <p className="section-kicker">Core Capabilities</p>
          <h3>What the system enables</h3>
        </div>

        <div className="project-capability-grid">
          {caseStudy.capabilities.map((capability, index) => (
            <article key={capability.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h4>{capability.title}</h4>
              <p>{capability.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="project-case-study-engineering">
        <div>
          <p className="section-kicker">Technology</p>
          <h3>Tools selected for the job</h3>

          <div
            className="project-detail-tech-list"
            aria-label="Project technologies"
          >
            {displayedTechnologies.map((technology) => (
              <span key={technology}>{technology}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="section-kicker">Engineering Delivery</p>
          <h3>Security, testing and deployment</h3>

          <ul>
            {caseStudy.delivery.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState<ProjectWithMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    api
      .get<ProjectWithMedia>(`/projects/${id}`)
      .then((response) => {
        setProject(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch project:", error);
        setErrorMessage("Project not found or backend is not running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const galleryImages: GalleryImage[] = (project?.images || []).map((image) =>
    project?.id === 11 &&
    image.image.split("/").pop() === "1783513662411-138828690-poster.png"
      ? {
          ...image,
          localSrc: pgtResearchPoster,
          caption: "PGT Onboard research poster",
        }
      : image
  );

  const legacyVideo: ProjectVideo[] =
    project?.video && (!project.videos || project.videos.length === 0)
      ? [
          {
            id: 0,
            project_id: project.id,
            video: project.video,
            caption: "Project video",
          },
        ]
      : [];

  const projectVideos: ProjectVideo[] = [
    ...(project?.videos || []),
    ...legacyVideo,
  ];

  const selectedImage: GalleryImage | null =
    selectedImageIndex !== null
      ? galleryImages[selectedImageIndex] ?? null
      : null;

  function openImage(index: number) {
    setSelectedImageIndex(index);
  }

  const closeImageModal = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const showPreviousImage = useCallback(() => {
    if (galleryImages.length === 0) return;

    setSelectedImageIndex((currentIndex) => {
      if (currentIndex === null) return null;

      return currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    });
  }, [galleryImages.length]);

  const showNextImage = useCallback(() => {
    if (galleryImages.length === 0) return;

    setSelectedImageIndex((currentIndex) => {
      if (currentIndex === null) return null;

      return currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1;
    });
  }, [galleryImages.length]);

  useEffect(() => {
    if (selectedImageIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeImageModal();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    closeImageModal,
    selectedImageIndex,
    showNextImage,
    showPreviousImage,
  ]);

  if (loading) {
    return (
      <main className="project-detail-loading">
        <p>Loading project...</p>
      </main>
    );
  }

  if (!project || errorMessage) {
    return (
      <main className="project-detail-error">
        <p>{errorMessage || "Project not found."}</p>

        <Link to="/projects" className="btn">
          Back to Projects
        </Link>
      </main>
    );
  }

  const heroImage = project.image || project.images?.[0]?.image || "";

  const technologies = project.technologies
    ? project.technologies
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean)
    : [];

  const caseStudy = getProjectCaseStudy(project);
  const preferredDescription = getPreferredProjectDescription(project);

  return (
    <main className="project-detail-page">
      <section className="project-detail-hero">
        {heroImage ? (
          <img
            src={getThumbnailUrl(heroImage, 1600)}
            alt={project.title}
            className="project-detail-hero-bg"
            fetchPriority="high"
            decoding="async"
          />
        ) : null}

        <div className="project-detail-hero-overlay" aria-hidden="true" />

        <div className="project-detail-hero-content">
          <Link to="/projects" className="project-detail-back-link">
            ← Back to Projects
          </Link>

          <div className="project-detail-meta">
            <span>{project.category}</span>

            <span className="project-detail-ownership-pill">
              {PROJECT_OWNERSHIP_LABEL}
            </span>

            {project.created_at && <span>{formatDate(project.created_at)}</span>}

            {project.featured === 1 && <span>Featured Build</span>}

            {projectVideos.length > 0 && (
              <span>{projectVideos.length} Video Demo(s)</span>
            )}
          </div>

          <h1>{project.title}</h1>

          <p>{preferredDescription}</p>

          <div className="project-detail-ownership-note">
            <strong>{PROJECT_OWNERSHIP_LABEL}</strong>
            <span>{PROJECT_OWNERSHIP_STATEMENT}</span>
          </div>

          <div className="project-detail-actions">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                View GitHub
              </a>
            )}

            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                Live Demo
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="project-detail-shell">
        {caseStudy ? (
          <ProjectCaseStudyContent
            caseStudy={caseStudy}
            technologies={technologies}
          />
        ) : (
          <div className="project-detail-info-grid">
            <article className="project-detail-story-card">
              <p className="section-kicker">Project Overview</p>

              <h2>What This Project Is About</h2>

              <p>{project.description}</p>
            </article>

            <aside className="project-detail-tech-card">
              <p className="section-kicker">Tech Stack</p>

              <h2>Tools Used</h2>

              {technologies.length > 0 ? (
                <div className="project-detail-tech-list">
                  {technologies.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>
              ) : (
                <p>No technologies listed.</p>
              )}
            </aside>
          </div>
        )}

        {projectVideos.length > 0 && (
          <section className="project-detail-video-section">
            <div className="project-detail-section-heading">
              <p className="section-kicker">Video Demo</p>

              <h2>Project Walkthrough</h2>

              <p>Watch the uploaded demo video previews for this project.</p>
            </div>

            <div className="project-detail-video-grid">
              {projectVideos.map((video, index) => (
                <article
                  key={`${video.id}-${video.video}`}
                  className="project-detail-video-card"
                >
                  <DeferredVideo
                    src={getImageUrl(video.video)}
                    poster={
                      heroImage
                        ? getThumbnailUrl(heroImage, 1200)
                        : undefined
                    }
                    className="project-detail-video"
                    label={`Play ${project.title} video ${index + 1}`}
                  />

                  <div className="project-detail-video-caption">
                    <span>Video {String(index + 1).padStart(2, "0")}</span>

                    {video.caption && <p>{video.caption}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {galleryImages.length > 0 && (
          <section className="project-detail-gallery-section">
            <div className="project-detail-section-heading">
              <p className="section-kicker">Project Gallery</p>

              <h2>Screenshots and Build Preview</h2>

              <p>Click any image to open the project viewer.</p>
            </div>

            <div className="project-detail-gallery-grid">
              {galleryImages.map((image, index) => (
                <figure
                  key={image.id}
                  className={`project-detail-gallery-item project-gallery-style-${
                    (index % 6) + 1
                  }${image.localSrc ? " project-gallery-poster" : ""}`}
                >
                  <button
                    type="button"
                    className="project-gallery-open-button"
                    onClick={() => openImage(index)}
                    aria-label={image.caption ? `Open ${image.caption}` : `Open project image ${index + 1}`}
                  >
                    <img
                      src={image.localSrc || getThumbnailUrl(image.image, 900)}
                      alt={image.caption || `${project.title} screenshot ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                    />

                    <span>Open Image</span>
                  </button>

                  <figcaption>
                    {image.caption || `Frame ${String(index + 1).padStart(2, "0")}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </section>

      {selectedImage && selectedImageIndex !== null && (
        <div
          className="project-image-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Project image viewer"
          onClick={closeImageModal}
        >
          <div
            className="project-image-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="project-modal-topbar">
              <div>
                <span>Project Viewer</span>

                <strong>
                  Frame {String(selectedImageIndex + 1).padStart(2, "0")} /{" "}
                  {String(galleryImages.length).padStart(2, "0")}
                </strong>
              </div>

              <button
                type="button"
                className="project-modal-close"
                onClick={closeImageModal}
                aria-label="Close project image viewer"
              >
                ×
              </button>
            </div>

            <div className="project-modal-image-wrap">
              <button
                type="button"
                className="project-modal-nav project-modal-prev"
                onClick={showPreviousImage}
                aria-label="Previous image"
              >
                ←
              </button>

              <img
                src={selectedImage.localSrc || getImageUrl(selectedImage.image)}
                alt={selectedImage.caption || `${project.title} enlarged screenshot ${
                  selectedImageIndex + 1
                }`}
                className="project-modal-image"
                decoding="async"
              />

              <button
                type="button"
                className="project-modal-nav project-modal-next"
                onClick={showNextImage}
                aria-label="Next image"
              >
                →
              </button>
            </div>

            <div className="project-modal-footer">
              <span>{project.title}</span>
              {selectedImage.localSrc && (
                <a href={selectedImage.localSrc} target="_blank" rel="noreferrer">
                  Open original image ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProjectDetails;
