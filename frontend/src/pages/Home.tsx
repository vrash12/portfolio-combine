import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { api, getThumbnailUrl } from "../api/client";
import type { BlogPost, Project } from "../types";
import FlagshipCaseStudies from "../components/FlagshipCaseStudies";
import { getPreferredBlogDescription } from "../data/blogEditorialContent";

const skillPath = "/images/logos-skill";

const psalmPassage = {
  title: "Psalm 19",
  subtitle: "For the choir director: A psalm of David.",
  verses: [
    {
      number: 1,
      text: "The heavens proclaim the glory of God. The skies display his craftsmanship.",
    },
    {
      number: 2,
      text: "Day after day they continue to speak; night after night they make him known.",
    },
    {
      number: 3,
      text: "They speak without a sound or word; their voice is never heard.",
    },
    {
      number: 4,
      text: "Yet their message has gone throughout the earth, and their words to all the world.",
    },
  ],
};

const missionCards = [
  {
    title: "Software Development",
    label: "Build",
    description:
      "I build application logic, APIs, authentication, and database systems that connect the interface to the data behind it.",
    image: `${skillPath}/logo13.webp`,
    fallback: "💻",
    accent: "#ff7a00",
    workflowNote:
      "I use Codex and Claude Code to explore solutions, write code more efficiently, and improve implementation. I review the changes, run tests, and validate the final behavior myself.",
    tools: [
      { name: "PHP", image: `${skillPath}/logo14.webp` },
      { name: "Java", image: `${skillPath}/logo13.webp` },
      { name: "Django", image: `${skillPath}/logo11.webp` },
      { name: "Flask", image: `${skillPath}/logo17.webp` },
      { name: "Docker", image: `${skillPath}/logo18.webp` },
      { name: "Supabase", image: `${skillPath}/supabase.svg` },
      { name: "PostgreSQL", image: `${skillPath}/postgresql.svg` },
      { name: "Drizzle ORM", image: `${skillPath}/drizzle.svg` },
      { name: "Google Cloud Run", image: `${skillPath}/googlecloud.svg` },
      { name: "AWS", image: `${skillPath}/aws.svg` },
      { name: "Codex", image: `${skillPath}/openai.svg` },
      { name: "Claude Code", image: `${skillPath}/claude.svg` },
    ],
  },
  {
    title: "Web Design & Development",
    label: "Create",
    description:
      "I design responsive layouts and turn them into websites and web applications, from custom interfaces to WordPress.",
    image: `${skillPath}/figma.svg`,
    fallback: "✦",
    accent: "#ffb84d",
    tools: [
      { name: "Next.js", image: `${skillPath}/nextjs.svg` },
      { name: "React", image: `${skillPath}/logo2.webp` },
      { name: "Vue.js", image: `${skillPath}/vuejs.svg` },
      { name: "TypeScript", image: `${skillPath}/typescript.svg` },
      { name: "HTML5", image: `${skillPath}/logo4.webp` },
      { name: "Tailwind CSS", image: `${skillPath}/tailwindcss.svg` },
      { name: "Custom CSS", image: `${skillPath}/css3.svg` },
      { name: "WordPress", image: `${skillPath}/wordpress.svg` },
      { name: "Elementor", image: `${skillPath}/elementor.svg` },
      { name: "Figma", image: `${skillPath}/figma.svg` },
      { name: "Vite", image: `${skillPath}/logo20.webp` },
    ],
  },
  {
    title: "Data Science",
    label: "Analyze",
    description:
      "I work with data cleaning, visualization, analysis, and machine learning workflows to turn raw data into useful insights.",
    image: `${skillPath}/logo10.webp`,
    fallback: "📊",
    accent: "#0057ff",
    tools: [
      { name: "Python", image: `${skillPath}/logo10.webp` },
      { name: "R", image: `${skillPath}/logo7.webp` },
      { name: "Anaconda", image: `${skillPath}/logo15.webp` },
      { name: "TensorFlow", image: `${skillPath}/logo6.webp` },
      { name: "Docker", image: `${skillPath}/logo18.webp` },
    ],
  },
  {
    title: "Artificial Intelligence",
    label: "Automate",
    description:
      "I explore AI-powered tools, intelligent systems, automation, and practical machine learning applications.",
    image: `${skillPath}/logo6.webp`,
    fallback: "🤖",
    accent: "#7c3cff",
    tools: [
      { name: "TensorFlow", image: `${skillPath}/logo6.webp` },
      { name: "Python", image: `${skillPath}/logo10.webp` },
      { name: "C++", image: `${skillPath}/logo9.webp` },
      { name: ".NET Core", image: `${skillPath}/logo3.webp` },
      { name: "Flutter", image: `${skillPath}/logo12.webp` },
    ],
  },
];

function PsalmPassage() {
  return (
    <div className="psalm-passage-card enhanced-psalm-card">
      <div className="psalm-card-top">
        <span className="psalm-label">{psalmPassage.title}</span>
        <span className="psalm-card-tag">NLT</span>
      </div>

      <p className="psalm-subtitle">{psalmPassage.subtitle}</p>

      <div className="psalm-verses">
        {psalmPassage.verses.map((verse) => (
          <p key={verse.number} className="psalm-verse-line">
            <sup>{verse.number}</sup>
            <span>{verse.text}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function FavoriteBibleVerseSection() {
  return (
    <section className="favorite-verse-section animated-verse-section enhanced-favorite-verse-section">
      <div className="verse-stars" aria-hidden="true">
        <span className="verse-star star-one" />
        <span className="verse-star star-two" />
        <span className="verse-star star-three" />
        <span className="verse-star star-four" />
        <span className="verse-star star-five" />
        <span className="verse-star star-six" />
      </div>

      <div className="shooting-star shooting-star-one" aria-hidden="true" />
      <div className="shooting-star shooting-star-two" aria-hidden="true" />

      <div className="verse-orbit verse-orbit-one" aria-hidden="true" />
      <div className="verse-orbit verse-orbit-two" aria-hidden="true" />

      <div className="verse-glow verse-glow-one" aria-hidden="true" />
      <div className="verse-glow verse-glow-two" aria-hidden="true" />

      <div className="favorite-verse-content enhanced-verse-content">
        <div className="favorite-verse-text enhanced-verse-text">
          <p className="section-kicker">My Favorite Bible Verse</p>

          <h2>
            The Heavens
            <span>Declare His Glory</span>
          </h2>

          <p>
            Psalm 19 reminds me that creation is not silent. The skies, the
            heavens, and the beauty of what God made all point back to His
            craftsmanship, purpose, and glory.
          </p>
        </div>

        <div className="enhanced-psalm-wrap">
          <PsalmPassage />
        </div>
      </div>
    </section>
  );
}
function getBlogCoverImage(post: BlogPost) {
  return post.image || post.images?.[0]?.image || "";
}

function Home() {
  const [isHeroFlipped, setIsHeroFlipped] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  const [blogsLoading, setBlogsLoading] = useState(true);

  const [blogsError, setBlogsError] = useState("");

  useEffect(() => {
    api
      .get<Project[]>("/projects")
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Failed to load projects:", error);
      });

    api
      .get<BlogPost[]>("/blogs")
      .then((response) => {
        setBlogs(response.data.slice(0, 3));
      })
      .catch((error) => {
        console.error("Failed to load blogs:", error);
        setBlogsError("Unable to load adventure logs right now.");
      })
      .finally(() => {
        setBlogsLoading(false);
      });
  }, []);

  return (
    <main className="space-theme">
      <section
        className={`hero-space animated-hero ${
          isHeroFlipped ? "hero-space-dark" : "hero-space-orange"
        }`}
      >
        <div className="space-doodle doodle-one">✦</div>
        <div className="space-doodle doodle-two">✺</div>
        <div className="space-doodle doodle-three">⌁</div>

        <div className="hero-star-field" aria-hidden="true">
          <span className="hero-star hero-star-one" />
          <span className="hero-star hero-star-two" />
          <span className="hero-star hero-star-three" />
          <span className="hero-star hero-star-four" />
        </div>

        <div
          className="hero-shooting-line hero-shooting-line-one"
          aria-hidden="true"
        />
        <div
          className="hero-shooting-line hero-shooting-line-two"
          aria-hidden="true"
        />

        <div className="hero-orbit-line hero-orbit-line-one" aria-hidden="true" />
        <div className="hero-orbit-line hero-orbit-line-two" aria-hidden="true" />

        <div className="hero-text">
          <p className="eyebrow">Developer in Orbit</p>

          <h1>
            Building Digital Systems
            <span className="highlight-text">from Earth to Orbit.</span>
          </h1>

          <p>
            I’m Van Rodolf Suliva, a developer focused on software development,
            data science, and artificial intelligence. I enjoy building
            practical, creative, and problem-solving driven projects.
          </p>

          <div className="hero-actions">
            <Link to="/projects" className="btn">
              Launch Projects
            </Link>

            <Link to="/blogs" className="btn btn-outline">
              View Adventure Quests
            </Link>
          </div>
        </div>

        <div className="hero-image-wrap">
          <div
            className={`hero-flip-card ${isHeroFlipped ? "is-flipped" : ""}`}
            tabIndex={0}
            role="button"
            aria-label="Flip portfolio image"
            onMouseEnter={() => setIsHeroFlipped(true)}
            onMouseLeave={() => setIsHeroFlipped(false)}
            onFocus={() => setIsHeroFlipped(true)}
            onBlur={() => setIsHeroFlipped(false)}
            onClick={() => setIsHeroFlipped((current) => !current)}
          >
            <div className="hero-flip-inner">
              <div className="hero-flip-face hero-flip-front">
                <img
                  src="/images/profile-space.webp"
                  alt="Van Rodolf Suiva portfolio profile orange space theme"
                  className="hero-profile-image"
                  width="1017"
                  height="1546"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>

              <div className="hero-flip-face hero-flip-back">
                <img
                  src="/images/profile-space-dark.webp"
                  alt="Van Rodolf Suiva portfolio profile dark space theme"
                  className="hero-profile-image"
                  width="1017"
                  height="1546"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div className="section-heading mission-heading">
          <p className="section-kicker">Mission Control</p>

          <h2>What I Build Around</h2>

          <p>
            From websites and application systems to data science and AI,
            these are the areas I build in and the tools I use along the way.
          </p>
        </div>

        <div className="mission-grid mission-grid-expanded">
          {missionCards.map((card, index) => (
            <article
              className="mission-card mission-card-with-tools"
              key={card.title}
              style={
                {
                  "--mission-accent": card.accent,
                } as CSSProperties
              }
            >
              <div className="mission-card-top">
                <span className="mission-number">0{index + 1}</span>
                <span className="mission-label">{card.label}</span>
              </div>

              <div className="mission-card-intro">
                <div className="mission-icon" aria-hidden="true">
                  <img
                    src={card.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";

                      const parent = event.currentTarget.parentElement;

                      if (parent) {
                        parent.dataset.fallback = card.fallback;
                      }
                    }}
                  />
                </div>

                <h3>{card.title}</h3>
              </div>

              <p>{card.description}</p>

              <div className="mission-tools">
                <span className="mission-tools-title">
                  Tools and Technologies
                </span>

                <ul className="mission-tools-grid" aria-label={`${card.title} tools`}>
                  {card.tools.map((tool) => (
                    <li
                      className="mission-tool-pill"
                      key={`${card.title}-${tool.name}`}
                    >
                      <div className="mission-tool-icon">
                        <img
                          src={tool.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      <span>{tool.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {card.workflowNote && (
                <div className="mission-workflow-note">
                  <h4>AI-assisted workflow</h4>
                  <p>{card.workflowNote}</p>
                </div>
              )}
            </article>
          ))}
        </div>

      </section>


      <FlagshipCaseStudies projects={projects} />


<section className="blog-galaxy-section home-blogs-section">
  <div className="section-heading home-section-heading">
    <p className="section-kicker home-kicker-light">Adventure Logs</p>

    <h2>Latest Stories From the Road, Trail, and Journey</h2>

    <p>
      When I’m offline, you’ll find me exploring new places, hiking trails,
      or taking the scenic route on two wheels. These are the stories I bring back.
    </p>
  </div>

  {blogsLoading ? (
    <p className="dynamic-section-message dynamic-section-message-dark">
      Loading adventure logs...
    </p>
  ) : blogsError ? (
    <p className="dynamic-section-message dynamic-section-message-dark">
      {blogsError}
    </p>
  ) : blogs.length === 0 ? (
    <p className="dynamic-section-message dynamic-section-message-dark">
      More stories from the road and trail are on the way. Check back soon.
    </p>
  ) : (
    <div className="home-blog-grid">
      {blogs.map((blog, index) => {
        const coverImage = getBlogCoverImage(blog);

        return (
          <article className="home-blog-card" key={blog.id}>
            <div className="home-blog-media">
              {coverImage ? (
                <img
                  src={getThumbnailUrl(coverImage, 900)}
                  alt={blog.title}
                  className="home-blog-image"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="home-blog-placeholder">
                  {blog.category || "Adventure"}
                </div>
              )}

              <span className="home-blog-number">0{index + 1}</span>
            </div>

            <div className="home-blog-content">
              {blog.category && (
                <span className="home-blog-category">{blog.category}</span>
              )}

              <h3>{blog.title}</h3>

              <p>{getPreferredBlogDescription(blog)}</p>

              {blog.location && (
                <p className="blog-location">📍 {blog.location}</p>
              )}

              <Link to={`/blogs/${blog.id}`} className="read-more">
                Read adventure
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  )}

  <div className="center-action">
    <Link to="/blogs" className="btn btn-outline-dark home-section-btn">
      Read Adventure Logs
    </Link>
  </div>
</section>

      <FavoriteBibleVerseSection />




<section className="connect-portal moon-landing-section">
  <div className="moon-landing-stars" aria-hidden="true">
    <span className="landing-star star-one" />
    <span className="landing-star star-two" />
    <span className="landing-star star-three" />
    <span className="landing-star star-four" />
  </div>

  <div className="moon-landing-orbit" aria-hidden="true" />

  <div className="moon-surface-shape" aria-hidden="true" />

  <div className="moon-landing-content">
    <div className="moon-contact-copy">
      <p className="section-kicker moon-landing-kicker">Open a Transmission</p>

      <h2>Have a project, idea, or opportunity?</h2>

      <p>
        Let’s connect and build something useful, creative, and technical.
      </p>

      <div className="moon-contact-actions">
        <a href="mailto:vansuliva4@gmail.com" className="btn moon-primary-btn">
          Email Me
        </a>

        <a
          href="https://www.linkedin.com/in/van-rodolf-suliva-779569380/"
          target="_blank"
          rel="noreferrer"
          className="btn moon-secondary-btn"
        >
          LinkedIn
        </a>
      </div>
    </div>

    <div className="moon-contact-visual" aria-hidden="true">
      <div className="moon-planet">
        <span className="moon-crater crater-one" />
        <span className="moon-crater crater-two" />
        <span className="moon-crater crater-three" />
        <span className="moon-crater crater-four" />
      </div>
    </div>
  </div>
</section>


    </main>
  );
}

export default Home;
