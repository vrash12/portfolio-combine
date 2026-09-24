import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  getImageUrl,
  getThumbnailUrl,
} from "../api/client";
import type { BlogImage, BlogPost } from "../types";
import { sanitizeBlogHtml } from "../utils/sanitizeBlogHtml";
import DeferredVideo from "../components/DeferredVideo";
import {
  getBlogEditorialContent,
  getPreferredBlogDescription,
  shouldUseEditorialBody,
} from "../data/blogEditorialContent";

function formatDate(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function BlogDetails() {
  const { id } = useParams();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    api
      .get<BlogPost>(`/blogs/${id}`)
      .then((response) => {
        setPost(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch blog post:", error);
        setErrorMessage("Blog post not found or backend is not running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const galleryImages: BlogImage[] = post?.images || [];
  const blogVideos = post?.videos || [];
  const selectedImage =
    selectedImageIndex !== null ? galleryImages[selectedImageIndex] : null;
  const sanitizedBody = useMemo(
    () => sanitizeBlogHtml(post?.body || ""),
    [post?.body]
  );

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
      <main className="blog-detail-loading">
        <p>Loading adventure...</p>
      </main>
    );
  }

  if (!post || errorMessage) {
    return (
      <main className="blog-detail-error">
        <p>{errorMessage || "Blog post not found."}</p>

        <Link to="/blogs" className="btn">
          Back to Quests
        </Link>
      </main>
    );
  }

  const tags = post.tags
    ? post.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const heroImage = post.image || post.images?.[0]?.image || "";
  const editorial = getBlogEditorialContent(post);
  const preferredDescription = getPreferredBlogDescription(post);
  const useEditorialBody = shouldUseEditorialBody(post.body);

  return (
    <main className="adventure-detail-page">
      <section className="adventure-hero-neo">
        {heroImage && (
          <img
            src={getThumbnailUrl(heroImage, 1600)}
            alt={post.title}
            className="adventure-hero-bg"
            fetchPriority="high"
            decoding="async"
          />
        )}

        <div className="adventure-hero-noise" aria-hidden="true" />

        <div className="adventure-hero-content">
          <Link to="/blogs" className="adventure-back-link">
            ← Back to Adventure Quests
          </Link>

          <div className="adventure-meta-pills">
            {post.category && <span>{post.category}</span>}

            <span>{formatDate(post.adventure_date || post.created_at)}</span>

            {post.location && <span>{post.location}</span>}
          </div>

          <h1>{post.title}</h1>

          <p>{preferredDescription}</p>
        </div>
      </section>

      <section className="adventure-detail-shell adventure-detail-shell-full">
        <article className="adventure-detail-main adventure-detail-main-full">
          {tags.length > 0 && (
            <div className="adventure-top-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}

          {editorial && (
            <section className="adventure-editorial-section">
              <div className="adventure-editorial-heading">
                <div>
                  <p className="section-kicker">Beyond the Frames</p>
                  <h2>What This Journey Meant</h2>
                </div>

                <p>
                  A short reflection on the experience behind the photographs
                  and the perspective I carried home.
                </p>
              </div>

              <div className="adventure-editorial-grid">
                <article>
                  <span>01 · The setting</span>
                  <p>{editorial.context}</p>
                </article>

                <article>
                  <span>02 · What stayed with me</span>
                  <p>{editorial.reflection}</p>
                </article>

                <aside>
                  <span>Strengthened along the way</span>
                  <div>
                    {editorial.qualities.map((quality) => (
                      <strong key={quality}>{quality}</strong>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          )}

          {galleryImages.length > 0 && (
            <section className="adventure-gallery-section adventure-gallery-full">
              <div className="adventure-section-heading adventure-section-heading-wide">
                <p className="section-kicker">Captured Frames</p>

                <h2>Snapshots From the Journey</h2>

                <p className="gallery-click-note">
                  Click any frame to open the mission viewer.
                </p>
              </div>

              <div className="adventure-gallery-collage adventure-gallery-collage-wide">
                {galleryImages.map((image, index) => (
                  <figure
                    key={image.id}
                    className={`adventure-gallery-item gallery-style-${
                      (index % 6) + 1
                    }`}
                  >
                    <button
                      type="button"
                      className="gallery-open-button"
                      onClick={() => openImage(index)}
                      aria-label={`Open frame ${index + 1}`}
                    >
                      <img
                        src={getThumbnailUrl(image.image, 900)}
                        alt={`${post.title} photo ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                      />

                      <span className="gallery-hover-label">Open Frame</span>
                    </button>

                    <figcaption>
                      Frame {String(index + 1).padStart(2, "0")}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {blogVideos.length > 0 && (
            <section className="project-detail-video-section">
              <div className="adventure-section-heading adventure-section-heading-wide">
                <p className="section-kicker">Journey Films</p>

                <h2>Videos From the Adventure</h2>
              </div>

              <div className="project-detail-video-grid">
                {blogVideos.map((video, index) => (
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
                      label={`Play ${post.title} video ${index + 1}`}
                    />

                    <div className="project-detail-video-caption">
                      <span>Video {String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="adventure-story-card adventure-story-card-wide">
            <div className="adventure-section-heading">
              <p className="section-kicker">Story Log</p>

              <h2>The Full Adventure</h2>
            </div>

            {useEditorialBody && editorial ? (
              <div className="adventure-story-body adventure-editorial-story">
                {editorial.story.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                <blockquote>{editorial.reflection}</blockquote>
              </div>
            ) : (
              <div
                className="adventure-story-body"
                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
              />
            )}
          </section>
        </article>
      </section>

      {selectedImage && selectedImageIndex !== null && (
        <div
          className="neo-image-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={closeImageModal}
        >
          <div
            className="neo-image-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="neo-modal-topbar">
              <div>
                <span className="neo-modal-kicker">Mission Viewer</span>
                <strong>
                  Frame {String(selectedImageIndex + 1).padStart(2, "0")} /{" "}
                  {String(galleryImages.length).padStart(2, "0")}
                </strong>
              </div>

              <button
                type="button"
                className="neo-modal-close"
                onClick={closeImageModal}
                aria-label="Close image viewer"
              >
                ×
              </button>
            </div>

            <div className="neo-modal-image-wrap">
              <button
                type="button"
                className="neo-modal-nav neo-modal-prev"
                onClick={showPreviousImage}
                aria-label="Previous image"
              >
                ←
              </button>

              <img
                src={getImageUrl(selectedImage.image)}
                alt={`${post.title} enlarged frame ${selectedImageIndex + 1}`}
                className="neo-modal-image"
                decoding="async"
              />

              <button
                type="button"
                className="neo-modal-nav neo-modal-next"
                onClick={showNextImage}
                aria-label="Next image"
              >
                →
              </button>
            </div>

            <div className="neo-modal-footer">
              <span>{post.title}</span>

        
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BlogDetails;
