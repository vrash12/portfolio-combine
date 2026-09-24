// frontend/src/pages/Blog.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { BlogPost } from "../types";
import BlogCard from "../components/BlogCard";
import { getPreferredBlogDescription } from "../data/blogEditorialContent";

const defaultCategories = ["Hiking", "Motorcycle", "Travel"];

function formatDate(date?: string | null) {
  if (!date) return "Recently added";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get<BlogPost[]>("/blogs")
      .then((response) => {
        setPosts(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch blog posts:", error);
        setErrorMessage("Failed to load blog posts. Please check your backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const postCategories = posts
      .map((post) => post.category)
      .filter((category): category is string => Boolean(category));

    return ["All", ...Array.from(new Set([...defaultCategories, ...postCategories]))];
  }, [posts]);

  const tags = useMemo(() => {
    const allTags = posts.flatMap((post) =>
      post.tags ? post.tags.split(",").map((tag) => tag.trim()) : []
    );

    return ["All", ...Array.from(new Set(allTags.filter(Boolean)))];
  }, [posts]);

  const latestPost = useMemo(() => {
    if (posts.length === 0) return null;

    return [...posts].sort((a, b) => {
      const firstDate = new Date(
        b.adventure_date || b.created_at || 0
      ).getTime();

      const secondDate = new Date(
        a.adventure_date || a.created_at || 0
      ).getTime();

      return firstDate - secondDate;
    })[0];
  }, [posts]);

  const filteredPosts = posts.filter((post) => {
    const categoryMatches =
      selectedCategory === "All" || post.category === selectedCategory;

    const postTags = post.tags
      ? post.tags.split(",").map((tag) => tag.trim())
      : [];

    const tagMatches = selectedTag === "All" || postTags.includes(selectedTag);

    return categoryMatches && tagMatches;
  });

  return (
    <main className="blog-page-clean">
      <section className="blog-hero-clean">
        <div className="blog-hero-clean-content">
          <div className="blog-hero-clean-copy">
            <p className="section-kicker">Adventure Quest</p>

            <h1>Quests</h1>

            <p>
              Personal stories from hiking trails, motorcycle rides, travel
              days, and memorable outdoor experiences.
            </p>

            <div className="blog-hero-stats">
              <span>{posts.length} posts</span>
              <span>{Math.max(categories.length - 1, 0)} categories</span>
              <span>{Math.max(tags.length - 1, 0)} tags</span>
            </div>
          </div>

          {latestPost && (
            <aside className="blog-latest-card">
              <span className="blog-latest-label">Latest Log</span>

              <h2>{latestPost.title}</h2>

              <p>{getPreferredBlogDescription(latestPost)}</p>

              <div className="blog-latest-meta">
                <span>{latestPost.category || "Adventure"}</span>
                <span>
                  {formatDate(latestPost.adventure_date || latestPost.created_at)}
                </span>
              </div>

              <Link to={`/blogs/${latestPost.id}`} className="blog-latest-link">
                Read Latest
              </Link>
            </aside>
          )}
        </div>
      </section>

      <section className="content-section blog-content-clean">
        <div className="blog-filter-panel blog-filter-clean">
          <div className="blog-filter-clean-header">
            <div>
              <h2>Explore by Adventure</h2>
              <p>Filter posts based on the type of story you want to read.</p>
            </div>

            <strong aria-live="polite" aria-atomic="true">{filteredPosts.length} shown</strong>
          </div>

          <div className="blog-filter-group">
            <span>Categories</span>

            <div className="tag-filter">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCategory === category}
                  className={
                    selectedCategory === category
                      ? "tag-button active"
                      : "tag-button"
                  }
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedTag("All");
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="blog-filter-group">
            <span>Tags</span>

            <div className="tag-filter">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selectedTag === tag}
                  className={selectedTag === tag ? "tag-button active" : "tag-button"}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading adventure quests...</p>
        ) : errorMessage ? (
          <p>{errorMessage}</p>
        ) : filteredPosts.length === 0 ? (
          <p>No blog posts found.</p>
        ) : (
          <div className="blog-grid">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Blog;
