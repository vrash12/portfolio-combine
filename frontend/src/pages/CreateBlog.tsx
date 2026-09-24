import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { BlogPost } from "../types";

function CreateBlog() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Hiking");
  const [location, setLocation] = useState("");
  const [adventureDate, setAdventureDate] = useState("");
  const [tags, setTags] = useState("Adventure, Hiking, Nature");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleCategoryChange(selectedCategory: string) {
    setCategory(selectedCategory);

    if (selectedCategory === "Hiking") {
      setTags("Adventure, Hiking, Nature");
    }

    if (selectedCategory === "Motorcycle") {
      setTags("Adventure, Motorcycle, Ride");
    }

    if (selectedCategory === "Travel") {
      setTags("Adventure, Travel, Personal");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !description.trim() || !body.trim()) {
      setErrorMessage("Please add a title, description, and blog body.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("body", body);
      formData.append("category", category);
      formData.append("location", location);
      formData.append("adventure_date", adventureDate);
      formData.append("tags", tags);
      formData.append("published", "1");

      images.forEach((image) => {
        formData.append("images", image);
      });

      videos.forEach((video) => {
        formData.append("videos", video);
      });

      const response = await api.post<BlogPost>("/blogs", formData);

      navigate(`/blogs/${response.data.id}`);
} catch (error: any) {
  console.error("Failed to create blog post:", error);

  if (error.response?.status === 401) {
    setErrorMessage("Your login expired. Please login again.");
    navigate("/login");
    return;
  }

  setErrorMessage(
    "Failed to create blog post. Please check your backend or try again."
  );
} finally {
  setSaving(false);
}
  }

  return (
    <main>
      <section className="page-hero blog-adventure-hero">
        <p className="section-kicker">New Adventure</p>

        <h1>Write Blog</h1>

        <p>
          Add a new hiking, motorcycle, or travel story to your portfolio blog.
          You can upload many images for one adventure.
        </p>
      </section>

      <section className="content-section">
        <form className="blog-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              Blog Title
              <input
                type="text"
                placeholder="Example: My First Mt. Ulap Hike"
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
                <option value="Hiking">Hiking</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Travel">Travel</option>
              </select>
            </label>
          </div>

          <label>
            Short Description
            <textarea
              rows={3}
              placeholder="Write a short summary of this adventure."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="form-grid-two">
            <label>
              Location
              <input
                type="text"
                placeholder="Example: Benguet, Philippines"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>

            <label>
              Adventure Date
              <input
                type="date"
                value={adventureDate}
                onChange={(event) => setAdventureDate(event.target.value)}
              />
            </label>
          </div>

          <label>
            Tags
            <input
              type="text"
              placeholder="Example: Hiking, Adventure, Nature"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </label>

          <label>
            Adventure Images
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
            Adventure Videos
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
              rows={14}
              placeholder="<p>Write your adventure story here...</p>"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          <div className="blog-form-help">
            <strong>Tip:</strong> You can write the body using simple HTML:
            <code>{"<p>Your story here...</p><h2>What I Learned</h2>"}</code>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Publishing..." : "Publish Blog"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateBlog;
