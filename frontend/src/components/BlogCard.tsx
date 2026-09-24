import { Link } from "react-router-dom";
import type { BlogPost } from "../types";
import { getThumbnailUrl } from "../api/client";
import { getPreferredBlogDescription } from "../data/blogEditorialContent";

type BlogCardProps = {
  post: BlogPost;
};

function formatDate(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogCard({ post }: BlogCardProps) {
  const tags = post.tags
    ? post.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const coverImage = post.image || post.images?.[0]?.image || "";

  return (
    <article className="blog-card adventure-blog-card hover-blog-card">
      <div className="blog-card-media">
        {coverImage ? (
          <img
            src={getThumbnailUrl(coverImage, 900)}
            alt={post.title}
            className="blog-image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="blog-image-placeholder">
            <span>{post.category || "Adventure"}</span>
          </div>
        )}

        <Link to={`/blogs/${post.id}`} className="blog-hover-overlay" aria-label={`Read ${post.title}`}>
          <span className="blog-hover-button">Read Adventure</span>
        </Link>
      </div>

      <div className="blog-card-content">
        <div className="blog-meta-row">
          {post.category && (
            <span className="blog-category">{post.category}</span>
          )}

          <span className="blog-date">
            {formatDate(post.adventure_date || post.created_at)}
          </span>
        </div>

        <h2>{post.title}</h2>

        <p>{getPreferredBlogDescription(post)}</p>

        {post.location && <p className="blog-location">📍 {post.location}</p>}

        {tags.length > 0 && (
          <div className="tag-list">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

     
      </div>
    </article>
  );
}

export default BlogCard;
