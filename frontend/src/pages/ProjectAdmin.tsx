import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  api,
  getImageUrl,
  getThumbnailUrl,
} from "../api/client";
import type { Project } from "../types";
import DeferredVideo from "../components/DeferredVideo";

const categories = [
  "Software Development",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Networking",
  "Web Development",
];

type ProjectImage = {
  id: number;
  project_id: number;
  image: string;
  caption?: string | null;
  created_at?: string;
};

type ProjectVideo = {
  id: number;
  project_id: number;
  video: string;
  caption?: string | null;
  created_at?: string;
};

type ProjectWithMedia = Project & {
  images?: ProjectImage[];
  video?: string | null;
  videos?: ProjectVideo[];
  github_url?: string | null;
  live_url?: string | null;
  featured?: number;
  published?: number;
  updated_at?: string;
};

type ProjectFormState = {
  title: string;
  description: string;
  category: string;
  technologies: string;
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  published: boolean;
};

const emptyForm: ProjectFormState = {
  title: "",
  description: "",
  category: "Software Development",
  technologies: "React, TypeScript, Node.js",
  githubUrl: "",
  liveUrl: "",
  featured: true,
  published: true,
};

function ProjectAdmin() {
  const [projects, setProjects] = useState<ProjectWithMedia[]>([]);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);

  const [coverInputKey, setCoverInputKey] = useState(0);
  const [galleryInputKey, setGalleryInputKey] = useState(0);
  const [videoInputKey, setVideoInputKey] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = editingId !== null;

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      setErrorMessage("");

      const response = await api.get<ProjectWithMedia[]>("/admin/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setErrorMessage("Failed to load projects. Please check your backend.");
    } finally {
      setLoadingProjects(false);
    }
  }

  function updateForm(field: keyof ProjectFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCategoryChange(category: string) {
    setForm((current) => ({
      ...current,
      category,
      technologies:
        category === "Software Development"
          ? "React, TypeScript, Node.js"
          : category === "Data Science"
            ? "Python, Pandas, Data Visualization"
            : category === "Artificial Intelligence"
              ? "Python, TensorFlow, AI Tools"
              : category === "Cybersecurity"
                ? "Networking, Firewalls, Security Tools"
                : category === "Networking"
                  ? "TCP/IP, Routing, Switching, Firewalls"
                  : "React, HTML, CSS, JavaScript",
    }));
  }

  function resetForm() {
    setForm(emptyForm);

    setCoverImage(null);
    setGalleryImages([]);
    setVideos([]);

    setCoverInputKey((current) => current + 1);
    setGalleryInputKey((current) => current + 1);
    setVideoInputKey((current) => current + 1);

    setEditingId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleEdit(project: ProjectWithMedia) {
    setEditingId(project.id);

    setForm({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Software Development",
      technologies: project.technologies || "",
      githubUrl: project.github_url || "",
      liveUrl: project.live_url || "",
      featured: project.featured === 1,
      published: project.published === 0 ? false : true,
    });

    setCoverImage(null);
    setGalleryImages([]);
    setVideos([]);

    setCoverInputKey((current) => current + 1);
    setGalleryInputKey((current) => current + 1);
    setVideoInputKey((current) => current + 1);

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setErrorMessage("Please add a title, description, and category.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("technologies", form.technologies);
      formData.append("github_url", form.githubUrl);
      formData.append("live_url", form.liveUrl);
      formData.append("featured", form.featured ? "1" : "0");
      formData.append("published", form.published ? "1" : "0");

      if (coverImage) {
        formData.append("image", coverImage);
      }

      galleryImages.forEach((image) => {
        formData.append("images", image);
      });

      videos.forEach((video) => {
        formData.append("videos", video);
      });

      if (isEditing) {
        await api.put(`/projects/${editingId}`, formData);
        setSuccessMessage("Project updated successfully.");
      } else {
        await api.post("/projects", formData);
        setSuccessMessage("Project created successfully.");
      }

      resetForm();
      await loadProjects();
    } catch (error: any) {
      console.error("Failed to save project:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your login expired. Please login again.");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to save project. Please check your backend or try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: ProjectWithMedia) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(project.id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/projects/${project.id}`);

      setSuccessMessage("Project deleted successfully.");

      if (editingId === project.id) {
        resetForm();
      }

      await loadProjects();
    } catch (error: any) {
      console.error("Failed to delete project:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your login expired. Please login again.");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to delete project. Please check your backend or try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getProjectCover(project: ProjectWithMedia) {
    return project.image || project.images?.[0]?.image || "";
  }

  function getFirstProjectVideo(project: ProjectWithMedia) {
    return project.videos?.[0]?.video || project.video || "";
  }

  function getProjectVideoCount(project: ProjectWithMedia) {
    return project.videos?.length || (project.video ? 1 : 0);
  }

  return (
    <main>
      <section className="page-hero blog-adventure-hero">
        <p className="section-kicker">Hidden Admin</p>

        <h1>Project Manager</h1>

        <p>
          Create, read, update, and delete your portfolio projects in one
          protected page. You can upload a cover image, multiple gallery images,
          and multiple project videos.
        </p>
      </section>

      <section className="content-section project-admin-layout">
        <form className="blog-form project-admin-form" onSubmit={handleSubmit}>
          <div className="project-admin-form-header">
            <div>
              <p className="section-kicker">
                {isEditing ? "Update Project" : "Create Project"}
              </p>

              <h2>{isEditing ? "Edit Project" : "New Project"}</h2>
            </div>

            {isEditing && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="form-grid-two">
            <label>
              Project Title
              <input
                type="text"
                placeholder="Example: Portfolio Adventure Blog"
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Project Description
            <textarea
              rows={5}
              placeholder="Write a clear description of this project."
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
            />
          </label>

          <label>
            Technologies
            <input
              type="text"
              placeholder="Example: React, TypeScript, Node.js, Express, SQLite"
              value={form.technologies}
              onChange={(event) =>
                updateForm("technologies", event.target.value)
              }
            />
          </label>

          <div className="form-grid-two">
            <label>
              <span className="optional-label">
                GitHub URL <small>Optional</small>
              </span>

              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={form.githubUrl}
                onChange={(event) =>
                  updateForm("githubUrl", event.target.value)
                }
              />
            </label>

            <label>
              <span className="optional-label">
                Live URL <small>Optional</small>
              </span>

              <input
                type="url"
                placeholder="https://your-project-demo.com"
                value={form.liveUrl}
                onChange={(event) => updateForm("liveUrl", event.target.value)}
              />
            </label>
          </div>

          <label>
            Cover Image
            <input
              key={coverInputKey}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                setCoverImage(selectedFile);
              }}
            />
          </label>

          {coverImage && (
            <div className="selected-images-preview">
              <strong>Selected cover image:</strong>

              <div className="selected-images-grid">
                <span>{coverImage.name}</span>
              </div>
            </div>
          )}

          <label>
            Project Gallery Images
            <input
              key={galleryInputKey}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => {
                const selectedFiles = Array.from(event.target.files || []);
                setGalleryImages(selectedFiles);
              }}
            />
          </label>

          {galleryImages.length > 0 && (
            <div className="selected-images-preview">
              <strong>{galleryImages.length} gallery image(s) selected:</strong>

              <div className="selected-images-grid">
                {galleryImages.map((image) => (
                  <span key={`${image.name}-${image.lastModified}`}>
                    {image.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <label>
            <span className="optional-label">
              Project Videos <small>Optional</small>
            </span>

            <input
              key={videoInputKey}
              type="file"
              multiple
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(event) => {
                const selectedFiles = Array.from(event.target.files || []);
                setVideos(selectedFiles);
              }}
            />
          </label>

          {videos.length > 0 && (
            <div className="selected-images-preview">
              <strong>{videos.length} video(s) selected:</strong>

              <div className="selected-images-grid">
                {videos.map((video) => (
                  <span key={`${video.name}-${video.lastModified}`}>
                    {video.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="project-check-options">
            <label className="project-check-label">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  updateForm("featured", event.target.checked)
                }
              />
              Mark as featured project
            </label>

            <label className="project-check-label">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  updateForm("published", event.target.checked)
                }
              />
              Publish this project
            </label>
          </div>

          <div className="blog-form-help">
            <strong>Tip:</strong>
            Use a strong cover image for project cards. Use gallery images for
            screenshots and videos for demos, walkthroughs, or screen recordings.
            <code>
              Example: A React + TypeScript portfolio with login, image uploads,
              project showcase, and multiple video previews.
            </code>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving
              ? isEditing
                ? "Updating Project..."
                : "Creating Project..."
              : isEditing
                ? "Update Project"
                : "Create Project"}
          </button>
        </form>

        <div className="project-admin-list">
          <div className="project-admin-list-header">
            <div>
              <p className="section-kicker">Read Projects</p>
              <h2>Existing Projects</h2>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={loadProjects}
            >
              Refresh
            </button>
          </div>

          {loadingProjects ? (
            <p className="dynamic-section-message">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="dynamic-section-message">No projects found.</p>
          ) : (
            <div className="project-admin-grid">
              {projects.map((project) => {
                const coverImageUrl = getProjectCover(project);
                const firstVideo = getFirstProjectVideo(project);
                const galleryCount = project.images?.length || 0;
                const videoCount = getProjectVideoCount(project);

                return (
                  <article className="project-admin-card" key={project.id}>
                    {coverImageUrl ? (
                      <img
                        src={getThumbnailUrl(coverImageUrl, 900)}
                        alt={project.title}
                        className="project-admin-image"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : firstVideo ? (
                      <DeferredVideo
                        src={getImageUrl(firstVideo)}
                        className="project-admin-video"
                        label={`Play ${project.title} preview`}
                        muted
                      />
                    ) : (
                      <div className="project-admin-placeholder">
                        {project.category || "Project"}
                      </div>
                    )}

                    <div className="project-admin-card-content">
                      <div className="blog-meta-row">
                        <span className="blog-category">
                          {project.category}
                        </span>

                        {project.featured === 1 && (
                          <span className="project-featured-pill">
                            Featured
                          </span>
                        )}
                      </div>

                      <h3>{project.title}</h3>

                      <p>{project.description}</p>

                      {project.technologies && (
                        <p className="project-tech">
                          <strong>Tech:</strong> {project.technologies}
                        </p>
                      )}

                      <div className="project-admin-media-pills">
                        {galleryCount > 0 && (
                          <span>{galleryCount} image(s)</span>
                        )}

                        {videoCount > 0 && <span>{videoCount} video(s)</span>}

                        {project.published === 0 && <span>Draft</span>}
                      </div>

                      {(project.github_url || project.live_url) && (
                        <div className="project-admin-links">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub
                            </a>
                          )}

                          {project.live_url && (
                            <a
                              href={project.live_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Live Demo
                            </a>
                          )}
                        </div>
                      )}

                      <div className="project-admin-actions">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleEdit(project)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn project-delete-btn"
                          disabled={deletingId === project.id}
                          onClick={() => handleDelete(project)}
                        >
                          {deletingId === project.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProjectAdmin;
