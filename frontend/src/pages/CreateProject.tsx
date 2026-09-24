import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Project } from "../types";

function CreateProject() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Software Development");
  const [technologies, setTechnologies] = useState(
    "React, TypeScript, Node.js"
  );
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [featured, setFeatured] = useState(true);
  const [published, setPublished] = useState(true);
  const [image, setImage] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleCategoryChange(selectedCategory: string) {
    setCategory(selectedCategory);

    if (selectedCategory === "Software Development") {
      setTechnologies("React, TypeScript, Node.js");
    }

    if (selectedCategory === "Data Science") {
      setTechnologies("Python, Pandas, Data Visualization");
    }

    if (selectedCategory === "Artificial Intelligence") {
      setTechnologies("Python, TensorFlow, AI Tools");
    }

    if (selectedCategory === "Cybersecurity") {
      setTechnologies("Networking, Firewalls, Security Tools");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !description.trim() || !category.trim()) {
      setErrorMessage("Please add a title, description, and category.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("technologies", technologies);
      formData.append("github_url", githubUrl);
      formData.append("live_url", liveUrl);
      formData.append("featured", featured ? "1" : "0");
      formData.append("published", published ? "1" : "0");

      if (image) {
        formData.append("image", image);
      }

      await api.post<Project>("/projects", formData);

      navigate("/projects");
    } catch (error: any) {
      console.error("Failed to create project:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your login expired. Please login again.");
        navigate("/login");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to create project. Please check your backend or try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <section className="page-hero blog-adventure-hero">
        <p className="section-kicker">New Build</p>

        <h1>Create Project</h1>

        <p>
          Add a new software, data science, AI, or technical project to your
          VRMS portfolio.
        </p>
      </section>

      <section className="content-section">
        <form className="blog-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              Project Title
              <input
                type="text"
                placeholder="Example: Portfolio Adventure Blog"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                <option value="Software Development">
                  Software Development
                </option>
                <option value="Data Science">Data Science</option>
                <option value="Artificial Intelligence">
                  Artificial Intelligence
                </option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Networking">Networking</option>
                <option value="Web Development">Web Development</option>
              </select>
            </label>
          </div>

          <label>
            Project Description
            <textarea
              rows={5}
              placeholder="Write a short description of what this project does, what problem it solves, and what technologies you used."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label>
            Technologies
            <input
              type="text"
              placeholder="Example: React, TypeScript, Node.js, Express, SQLite"
              value={technologies}
              onChange={(event) => setTechnologies(event.target.value)}
            />
          </label>

          <div className="form-grid-two">
            <label>
              GitHub URL
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
              />
            </label>

            <label>
              Live URL
              <input
                type="url"
                placeholder="https://your-project-demo.com"
                value={liveUrl}
                onChange={(event) => setLiveUrl(event.target.value)}
              />
            </label>
          </div>

          <label>
            Project Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                setImage(selectedFile);
              }}
            />
          </label>

          {image && (
            <div className="selected-images-preview">
              <strong>Selected image:</strong>

              <div className="selected-images-grid">
                <span>{image.name}</span>
              </div>
            </div>
          )}

          <div className="project-check-options">
            <label className="project-check-label">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
              />
              Mark as featured project
            </label>

            <label className="project-check-label">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
              />
              Publish this project
            </label>
          </div>

          <div className="blog-form-help">
            <strong>Tip:</strong>
            Keep the description simple, clear, and project-focused.
            <code>
              Example: A React + TypeScript portfolio with login, image uploads,
              blog posts, and project showcase.
            </code>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateProject;
