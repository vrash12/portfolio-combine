import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, getThumbnailUrl } from "../api/client";
import type { BlogPost } from "../types";

const categories = ["Hiking", "Motorcycle", "Travel"];

type BlogFormState = {
  title: string;
  description: string;
  body: string;
  category: string;
  location: string;
  adventureDate: string;
  tags: string;
  published: boolean;
};

const emptyForm: BlogFormState = {
  title: "",
  description: "",
  body: "",
  category: "Hiking",
  location: "",
  adventureDate: "",
  tags: "Adventure, Hiking, Nature",
  published: true,
};

function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = editingId !== null;

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      setLoadingPosts(true);
      setErrorMessage("");

      const response = await api.get<BlogPost[]>("/blogs");
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to load blogs:", error);
      setErrorMessage("Failed to load blog posts. Please check your backend.");
    } finally {
      setLoadingPosts(false);
    }
  }

  function updateForm(field: keyof BlogFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCategoryChange(category: string) {
    setForm((current) => ({
      ...current,
      category,
      tags:
        category === "Hiking"
          ? "Adventure, Hiking, Nature"
          : category === "Motorcycle"
            ? "Adventure, Motorcycle, Ride"
            : "Adventure, Travel, Personal",
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setImages([]);
    setVideos([]);
    setEditingId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleEdit(post: BlogPost) {
    setEditingId(post.id);

    setForm({
      title: post.title || "",
      description: post.description || "",
      body: post.body || "",
      category: post.category || "Hiking",
      location: post.location || "",
      adventureDate: post.adventure_date || "",
      tags: post.tags || "",
      published: post.published === 0 ? false : true,
    });

    setImages([]);
    setVideos([]);
    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.body.trim()) {
      setErrorMessage("Please add a title, description, and blog body.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("body", form.body);
      formData.append("category", form.category);
      formData.append("location", form.location);
      formData.append("adventure_date", form.adventureDate);
      formData.append("tags", form.tags);
      formData.append("published", form.published ? "1" : "0");

      images.forEach((image) => {
        formData.append("images", image);
      });

      videos.forEach((video) => {
        formData.append("videos", video);
      });

      if (isEditing) {
        await api.put(`/blogs/${editingId}`, formData);
        setSuccessMessage("Blog post updated successfully.");
      } else {
        await api.post("/blogs", formData);
        setSuccessMessage("Blog post created successfully.");
      }

      resetForm();
      await loadBlogs();
    } catch (error: any) {
      console.error("Failed to save blog:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your login expired. Please login again.");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to save blog post. Please check your backend or try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post: BlogPost) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${post.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(post.id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/blogs/${post.id}`);

      setSuccessMessage("Blog post deleted successfully.");

      if (editingId === post.id) {
        resetForm();
      }

      await loadBlogs();
    } catch (error: any) {
      console.error("Failed to delete blog:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your login expired. Please login again.");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to delete blog post. Please check your backend or try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getCoverImage(post: BlogPost) {
    return post.image || post.images?.[0]?.image || "";
  }

  return (
    <main>
      <section className="page-hero blog-adventure-hero">
        <p className="section-kicker">Hidden Admin</p>

        <h1>Blog Manager</h1>

        <p>
          Create, read, update, and delete your adventure blog posts in one
          protected page.
        </p>
      </section>

      <section className="content-section blog-admin-layout">
        <form className="blog-form blog-admin-form" onSubmit={handleSubmit}>
          <div className="blog-admin-form-header">
            <div>
              <p className="section-kicker">
                {isEditing ? "Update Blog" : "Create Blog"}
              </p>

              <h2>{isEditing ? "Edit Blog Post" : "New Blog Post"}</h2>
            </div>

            {isEditing && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="form-grid-two">
            <label>
              Blog Title
              <input
                type="text"
                placeholder="Example: My First Mt. Ulap Hike"
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
            Short Description
            <textarea
              rows={3}
              placeholder="Write a short summary of this adventure."
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
            />
          </label>

          <div className="form-grid-two">
            <label>
              Location
              <input
                type="text"
                placeholder="Example: Benguet, Philippines"
                value={form.location}
                onChange={(event) => updateForm("location", event.target.value)}
              />
            </label>

            <label>
              Adventure Date
              <input
                type="date"
                value={form.adventureDate}
                onChange={(event) =>
                  updateForm("adventureDate", event.target.value)
                }
              />
            </label>
          </div>

          <label>
            Tags
            <input
              type="text"
              placeholder="Example: Hiking, Adventure, Nature"
              value={form.tags}
              onChange={(event) => updateForm("tags", event.target.value)}
            />
          </label>

          <label>
            Blog Images
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => {
                const selectedFiles = Array.from(event.target.files || []);
                setImages(selectedFiles);
              }}
            />
          </label>

          {images.length > 0 && (
            <div className="selected-images-preview">
              <strong>{images.length} image(s) selected</strong>

              <div className="selected-images-grid">
                {images.map((image) => (
                  <span key={`${image.name}-${image.lastModified}`}>
                    {image.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <label>
            Blog Videos
            <input
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
              <strong>{videos.length} video(s) selected</strong>

              <div className="selected-images-grid">
                {videos.map((video) => (
                  <span key={`${video.name}-${video.lastModified}`}>
                    {video.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <label>
            Blog Body
            <textarea
              rows={12}
              placeholder="<p>Write your adventure story here...</p>"
              value={form.body}
              onChange={(event) => updateForm("body", event.target.value)}
            />
          </label>

          <label className="project-check-label blog-published-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                updateForm("published", event.target.checked)
              }
            />
            Publish this blog post
          </label>

          <div className="blog-form-help">
            <strong>Tip:</strong> You can use simple HTML for the blog body.
            <code>{"<p>Your story here...</p><h2>What I Learned</h2>"}</code>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving
              ? isEditing
                ? "Updating Blog..."
                : "Creating Blog..."
              : isEditing
                ? "Update Blog"
                : "Create Blog"}
          </button>
        </form>

        <div className="blog-admin-list">
          <div className="blog-admin-list-header">
            <div>
              <p className="section-kicker">Read Blogs</p>
              <h2>Existing Blog Posts</h2>
            </div>

            <button type="button" className="btn btn-outline" onClick={loadBlogs}>
              Refresh
            </button>
          </div>

          {loadingPosts ? (
            <p>Loading blog posts...</p>
          ) : posts.length === 0 ? (
            <p>No blog posts found.</p>
          ) : (
            <div className="blog-admin-grid">
              {posts.map((post) => {
                const coverImage = getCoverImage(post);

                return (
                  <article className="blog-admin-card" key={post.id}>
                    {coverImage ? (
                      <img
                        src={getThumbnailUrl(coverImage, 900)}
                        alt={post.title}
                        className="blog-admin-image"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="blog-admin-placeholder">
                        {post.category || "Blog"}
                      </div>
                    )}

                    <div className="blog-admin-card-content">
                      <div className="blog-meta-row">
                        {post.category && (
                          <span className="blog-category">{post.category}</span>
                        )}

                        <span className="blog-date">
                          {post.published === 0 ? "Draft" : "Published"}
                        </span>
                      </div>

                      <h3>{post.title}</h3>

                      <p>{post.description}</p>

                      {post.location && (
                        <p className="blog-location">📍 {post.location}</p>
                      )}

                      <div className="blog-admin-actions">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleEdit(post)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn blog-delete-btn"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post)}
                        >
                          {deletingId === post.id ? "Deleting..." : "Delete"}
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

export default BlogAdmin;
