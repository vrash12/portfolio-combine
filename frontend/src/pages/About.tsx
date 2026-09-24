import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

const linkedInUrl =
  "https://www.linkedin.com/in/van-rodolf-suliva-779569380/";

const githubUrl =
  "https://github.com/vrash12";

const skillGroups = [
  {
    title: "Programming",
    description: "The foundations I use to turn a problem into working software.",
    iconPath: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
    items: ["Python", "JavaScript", "TypeScript", "Java", "PHP", "C++"],
  },
  {
    title: "Web Development",
    description: "Responsive websites and interfaces, from custom applications to WordPress.",
    iconPath: "M3 3h18v18H3V3Zm0 5h18M7 5.5h.01M10 5.5h.01M7 12h4v5H7v-5Zm8 0h2m-2 4h2",
    items: ["HTML", "Custom CSS", "Tailwind CSS", "React", "Next.js", "Vue.js", "WordPress", "Elementor"],
  },
  {
    title: "Backend Development",
    description: "APIs, authentication, and application logic behind the experience.",
    iconPath: "M3 3h18v7H3V3Zm0 11h18v7H3v-7Zm4-7h.01M7 17h.01M12 7h5m-5 10h5",
    items: [
      "Django",
      "Laravel",
      "Flask",
      "Node.js",
      "Supabase",
      "Spring Boot",
      "PHP",
    ],
  },
  {
    title: "Mobile Development",
    description: "Connected experiences that go beyond the browser.",
    iconPath: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 3h4m-3 14h2",
    items: ["React Native"],
  },
  {
    title: "Embedded Systems / IoT",
    description: "Bringing software into the world of connected devices.",
    iconPath: "M6 6h12v12H6V6Zm3 3h6v6H9V9ZM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4",
    items: ["Raspberry Pi", "Arduino"],
  },
  {
    title: "Networking & OS",
    description: "The systems and connections that keep things running.",
    iconPath: "M9 2h6v6H9V2ZM2 16h6v6H2v-6Zm14 0h6v6h-6v-6ZM12 8v4M5 16v-4h14v4",
    items: ["Linux", "Windows", "Network Administration"],
  },
  {
    title: "Databases & ORM",
    description: "Database schemas, structured storage, and queries that connect data to applications.",
    iconPath: "M20 5c0 2-3.6 3-8 3S4 7 4 5s3.6-3 8-3 8 1 8 3ZM4 5v14c0 2 3.6 3 8 3s8-1 8-3V5M4 12c0 2 3.6 3 8 3s8-1 8-3",
    items: ["MySQL", "PostgreSQL", "Drizzle ORM"],
  },
];

const workflowGroups = [
  {
    title: "Design, build & collaborate",
    items: ["Git/GitHub", "Postman", "VS Code", "Figma"],
  },
  {
    title: "Cloud & deployment",
    items: ["Docker", "AWS", "Google Cloud Run"],
  },
  {
    title: "AI-assisted development",
    items: ["Claude Code", "Codex"],
  },
];

const achievements = [
  {
    title: "Magna Cum Laude",
    detail: "Graduated July 31, 2026",
  },
  {
    title: "Best Capstone Project",
    detail: "2026",
  },
  {
    title: "3rd Place · STEM Category",
    detail: "Saliksiklaban University-wide Undergraduate Research Competition, 2026",
  },
];

const workingPrinciples = [
  {
    title: "Understand the real problem.",
    description:
      "Study the context, ask better questions, and test assumptions before choosing a solution.",
  },
  {
    title: "Build with intention.",
    description:
      "Choose the technology that fits, from responsive interfaces and production APIs to connected devices.",
  },
  {
    title: "Learn. Refine. Repeat.",
    description:
      "Gather feedback, validate the details, and use evidence to make each iteration more useful.",
  },
];

type ContactForm = {
  name: string;
  email: string;
  message: string;
};

const emptyContactForm: ContactForm = {
  name: "",
  email: "",
  message: "",
};

function About() {
  const [contactForm, setContactForm] =
    useState<ContactForm>(emptyContactForm);

  const [formNotice, setFormNotice] = useState("");

  function updateContactForm(
    field: keyof ContactForm,
    value: string
  ) {
    setContactForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleContactSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const subject = `Portfolio Inquiry from ${contactForm.name}`;

    const body = `
Name: ${contactForm.name}
Email: ${contactForm.email}

Message:
${contactForm.message}
    `.trim();

    window.location.href = `mailto:vansuliva4@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    setFormNotice("Opening your email app...");
  }

  return (
    <main className="about-page neo-about-page">
      <section className="about-hero-neo about-hero-refined">
        <div
          className="about-hero-pattern"
          aria-hidden="true"
        >
          <span className="about-plus about-plus-one">
            +
          </span>

          <span className="about-plus about-plus-two">
            +
          </span>

          <span className="about-plus about-plus-three">
            +
          </span>

          <span className="about-orbit about-orbit-one" />
          <span className="about-orbit about-orbit-two" />
        </div>

        <div className="about-hero-content">
          <p className="section-kicker">About Me</p>

          <h1>
            Van Rodolf
            <span>M. Suliva</span>
          </h1>

          <p>
            I’m a versatile programmer and IT professional who
            enjoys working across web, mobile, backend, AI,
            databases, cloud, and IoT. I’m also passionate
            about research that turns real-world problems into
            practical, evidence-based technology. I am
            currently pursuing my Master in Information
            Technology at Tarlac State University.
          </p>

          <div className="about-hero-actions">
            <a
              href="mailto:vansuliva4@gmail.com"
              className="btn"
            >
              Email Me
            </a>

            <a
              href={linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              aria-label="Open Van Rodolf Suliva's LinkedIn profile"
            >
              LinkedIn
            </a>

            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              aria-label="Open Van Rodolf Suliva's GitHub profile"
            >
              GitHub
            </a>
          </div>
        </div>

        <aside className="about-contact-form-card">
          <div className="about-contact-form-top">
            <span>Contact Form</span>
            <strong>Available</strong>
          </div>

          <h2>Let’s build something useful.</h2>

          <p>
            Send a short message about your project,
            collaboration, internship, or software development
            opportunity.
          </p>

          <form
            className="about-contact-form"
            onSubmit={handleContactSubmit}
          >
            <label>
              Name

              <input
                type="text"
                value={contactForm.name}
                onChange={(event) =>
                  updateContactForm(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Email

              <input
                type="email"
                value={contactForm.email}
                onChange={(event) =>
                  updateContactForm(
                    "email",
                    event.target.value
                  )
                }
                placeholder="your@email.com"
                required
              />
            </label>

            <label>
              Message

              <textarea
                rows={5}
                value={contactForm.message}
                onChange={(event) =>
                  updateContactForm(
                    "message",
                    event.target.value
                  )
                }
                placeholder="Tell me what you need help with..."
                required
              />
            </label>

            {formNotice && (
              <p className="about-form-notice" role="status">
                {formNotice}
              </p>
            )}

            <button
              type="submit"
              className="btn about-form-submit"
            >
              Send Message
            </button>
          </form>

          <div className="about-contact-mini-grid">
            <div>
              <span>Email</span>

              <strong>
                <a href="mailto:vansuliva4@gmail.com">
                  vansuliva4@gmail.com
                </a>
              </strong>
            </div>

            <div>
              <span>Location</span>
              <strong>Tarlac, Philippines</strong>
            </div>

            <div>
              <span>LinkedIn</span>

              <strong>
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Profile ↗
                </a>
              </strong>
            </div>

            <div>
              <span>GitHub</span>

              <strong>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Repositories ↗
                </a>
              </strong>
            </div>
          </div>
        </aside>
      </section>

      <section
        className="about-summary-section"
        aria-labelledby="about-summary-title"
      >
        <div className="about-summary-layout">
          <div className="about-summary-card">
            <div className="about-summary-card-top">
              <p className="about-summary-eyebrow">
                Professional Summary
              </p>
              <svg
                className="about-summary-spark"
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                aria-hidden="true"
              >
                <path d="M32 3v58M3 32h58M11.5 11.5l41 41M11.5 52.5l41-41" />
              </svg>
            </div>

            <h2 id="about-summary-title">
              Built on curiosity.
              <span>Driven by purpose.</span>
            </h2>

            <p className="about-summary-intro">
              I’m a versatile programmer who turns research
              into practical software. I adapt across
              technologies to build reliable solutions that
              are useful to the people they serve.
            </p>

            <div className="about-summary-domains">
              <p className="about-summary-eyebrow">
                One mindset. Many technologies.
              </p>
              <ul aria-label="Areas I work across">
                <li>Web &amp; mobile</li>
                <li>Backend &amp; APIs</li>
                <li>GIS &amp; real-time</li>
                <li>AI &amp; IoT</li>
              </ul>
            </div>
          </div>

          <div className="about-summary-approach">
            <div className="about-summary-approach-top">
              <p className="about-summary-eyebrow">How I work</p>
              <span aria-hidden="true">01 — 03</span>
            </div>

            <h3>Good software starts with better questions.</h3>

            <ol className="about-summary-principles">
              {workingPrinciples.map((principle, index) => (
                <li key={principle.title}>
                  <span
                    className="about-summary-step"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4>{principle.title}</h4>
                    <p>{principle.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="about-summary-tool-note">
            <span className="about-summary-tool-icon" aria-hidden="true">
              &lt;/&gt;
            </span>
            <div>
              <h3>AI in the workflow. Ownership in every decision.</h3>
              <p>
                I use Claude Code and Codex for research,
                architecture, debugging, testing, and
                documentation. I review and validate the
                final work myself.
              </p>
            </div>
            <span className="about-summary-tool-tag">
              Always learning ↗
            </span>
          </aside>
        </div>
      </section>

      <section
        className="about-education-section"
        aria-labelledby="about-education-title"
      >
        <div className="education-inner">
          <div className="education-heading">
            <div>
              <p className="section-kicker">Education</p>
              <h2 id="about-education-title">Academic <span>Background.</span></h2>
            </div>
            <p>
              A foundation in information technology. An ongoing
              commitment to learning, research, and building better software.
            </p>
          </div>

          <div className="education-degrees">
            <article className="education-card education-card-graduate">
              <div className="education-card-top">
                <p className="education-level"><span aria-hidden="true">01 /</span> Graduate studies</p>
                <span className="education-status education-status-current">
                  <span aria-hidden="true" /> In progress
                </span>
              </div>
              <div className="education-degree-heading">
                <span className="education-degree-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7c5-2 9-1 13 2 4-3 8-4 13-2v20c-5-2-9-1-13 2-4-3-8-4-13-2V7Zm13 2v20M7 12l5 1m-5 5 5 1m8-6 5-1m-5 7 5-1" />
                  </svg>
                </span>
                <h3>Master in <span>Information Technology</span></h3>
              </div>
              <div className="education-institution">
                <strong>Tarlac State University</strong>
                <p><time dateTime="2026-08">August 2026</time> — Present</p>
              </div>
              <p className="education-description">
                Pursuing graduate studies to deepen my knowledge of software
                development, information systems, networking, and modern
                technology solutions.
              </p>
              <div className="education-focus">
                <h4>Exploring further</h4>
                <ul className="education-tags" aria-label="Graduate study focus areas">
                  <li>Information systems</li>
                  <li>Software development</li>
                  <li>Networking</li>
                </ul>
              </div>
            </article>

            <article className="education-card education-card-undergraduate">
              <div className="education-card-top">
                <p className="education-level"><span aria-hidden="true">02 /</span> Undergraduate</p>
                <span className="education-status">Completed</span>
              </div>
              <div className="education-degree-heading">
                <span className="education-degree-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 12 14-7 14 7-14 7L2 12Zm6 3v8c5 4 11 4 16 0v-8m6-3v12" />
                  </svg>
                </span>
                <h3>Bachelor of Science in <span>Information Technology</span></h3>
              </div>
              <div className="education-institution">
                <strong>Tarlac State University</strong>
                <p><time dateTime="2022-08">August 2022</time> — <time dateTime="2026-07">July 2026</time></p>
              </div>
              <p className="education-description">
                Specialized in Network and Administration, with a foundation in
                programming, databases, systems, web development, and IT
                project implementation.
              </p>
              <div className="education-focus">
                <h4>Built on the fundamentals</h4>
                <ul className="education-tags" aria-label="Undergraduate study focus areas">
                  <li>Network administration</li>
                  <li>Programming</li>
                  <li>Databases</li>
                </ul>
              </div>
            </article>
          </div>

          <aside className="education-honors" aria-labelledby="education-honors-title">
            <div className="education-honors-heading">
              <h3 id="education-honors-title">Undergraduate honors</h3>
              <span>Class of 2026</span>
            </div>
            <ul className="education-honors-list">
              {achievements.map((achievement) => (
                <li key={achievement.title}>
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="16" cy="12" r="8" />
                    <path d="m10 18-3 11 9-4 9 4-3-11m-6-11 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5L16 7Z" />
                  </svg>
                  <div>
                    <h4>{achievement.title}</h4>
                    <p>{achievement.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section
        className="about-skills-section"
        aria-labelledby="about-skills-title"
      >
        <div className="about-skills-inner">
          <div className="about-skills-heading">
            <div>
              <p className="section-kicker">Technical Skills</p>
              <h2 id="about-skills-title">
                A versatile toolkit.<br />
                <span>A practical mindset.</span>
              </h2>
            </div>
            <p>
              From the interface to the infrastructure, I
              choose technologies to fit the problem and
              connect them into a complete solution.
            </p>
          </div>

          <div className="about-skills-grid">
            {skillGroups.map((group, index) => (
              <article
                className={`about-skill-card${index === 0 ? " about-skill-foundation" : ""}`}
                key={group.title}
              >
                <div className="about-skill-card-top">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={group.iconPath} />
                  </svg>
                  <span className="about-skill-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <ul className="about-skill-tags" aria-label={`${group.title} technologies`}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="about-skills-workflow">
            <div className="about-skills-workflow-heading">
              <p>Tools &amp; Deployment</p>
              <h3>From the first commit<br />to the next release.</h3>
              <svg viewBox="0 0 72 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12h67m-9-9 9 9-9 9" />
              </svg>
            </div>
            <div className="about-skills-workflow-groups">
              {workflowGroups.map((group, index) => (
                <div className="about-skills-workflow-group" key={group.title}>
                  <h4>
                    <span aria-hidden="true">0{index + 1}</span>
                    {group.title}
                  </h4>
                  <ul className="about-skill-tags" aria-label={`${group.title} tools`}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="about-experience-section"
        aria-labelledby="about-experience-title"
      >
        <div className="about-experience-inner">
          <div className="about-experience-heading">
            <div>
              <p className="section-kicker">Experience</p>
              <h2 id="about-experience-title">
                Real problems.<br />
                <span>Practical solutions.</span>
              </h2>
            </div>
            <div className="about-experience-heading-note">
              <p>
                From local agriculture to client applications,
                I build software around the people and
                workflows it needs to support.
              </p>
              <Link className="about-experience-project-link" to="/projects">
                Explore my projects <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="about-experience-grid">
            <article className="about-experience-card about-experience-intern">
              <header className="about-experience-role">
                <div className="about-experience-meta">
                  <span className="about-experience-category">
                    <span aria-hidden="true">01 /</span> Public service
                  </span>
                  <span className="about-experience-date">
                    <time dateTime="2026-02">Feb 2026</time>
                    {" — "}
                    <time dateTime="2026-05">May 2026</time>
                  </span>
                </div>
                <div className="about-experience-role-title">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 13h24L16 5 4 13ZM7 15v11m6-11v11m6-11v11m6-11v11M4 27h24" />
                  </svg>
                  <h3>Software Developer <span>Intern</span></h3>
                </div>
                <p className="about-experience-company">
                  Municipal Agriculture Office
                  <span>Ramos, Tarlac</span>
                </p>
              </header>

              <div className="about-experience-details">
                <p className="about-experience-label">What I delivered</p>
                <h4>One system for a more connected agriculture office.</h4>
                <p className="about-experience-description">
                  Developed and implemented a custom management
                  system to bring essential agricultural records
                  into one place.
                </p>
                <ul className="about-experience-highlights">
                  <li>
                    <strong>Centralized records</strong>
                    <span>Farmer profiles, rice seed distribution, and cooperative data.</span>
                  </li>
                  <li>
                    <strong>Mapping that adds context</strong>
                    <span>Google Maps API integration for land plotting and farm locations.</span>
                  </li>
                  <li>
                    <strong>Smoother daily workflows</strong>
                    <span>Tools to improve record tracking, reporting, and office operations.</span>
                  </li>
                </ul>
                <ul className="about-experience-tags" aria-label="Internship focus areas">
                  <li>Information systems</li>
                  <li>Google Maps API</li>
                  <li>GIS</li>
                </ul>
              </div>
            </article>

            <article className="about-experience-card about-experience-freelance">
              <header className="about-experience-role">
                <div className="about-experience-meta">
                  <span className="about-experience-category">
                    <span aria-hidden="true">02 /</span> Independent work
                  </span>
                  <span className="about-experience-date">
                    <time dateTime="2024">2024</time> — Present
                  </span>
                </div>
                <div className="about-experience-role-title">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="26" height="22" rx="3" />
                    <path d="M3 11h26m-18 5-3 3 3 3m10-6 3 3-3 3m-4-7-2 9" />
                  </svg>
                  <h3>Freelance <span>Software Developer</span></h3>
                </div>
                <p className="about-experience-company">
                  Self-Employed
                  <span className="about-experience-current">
                    <span aria-hidden="true" /> Ongoing
                  </span>
                </p>
              </header>

              <div className="about-experience-details">
                <p className="about-experience-label">How I help clients</p>
                <h4>From the first conversation to the next release.</h4>
                <p className="about-experience-description">
                  Develop web and mobile applications for
                  clients, with hands-on involvement throughout
                  the development process.
                </p>
                <ul className="about-experience-highlights">
                  <li>
                    <strong>Understand &amp; plan</strong>
                    <span>Requirements gathering and UI/UX planning around client needs.</span>
                  </li>
                  <li>
                    <strong>Build &amp; deliver</strong>
                    <span>Application development, deployment, and documentation.</span>
                  </li>
                  <li>
                    <strong>Support &amp; improve</strong>
                    <span>Bug fixes, ongoing improvements, and new features as needs evolve.</span>
                  </li>
                </ul>
                <ul className="about-experience-tags" aria-label="Freelance focus areas">
                  <li>Web &amp; mobile</li>
                  <li>UI/UX</li>
                  <li>Deployment</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

    </main>
  );
}

export default About;
