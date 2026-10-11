import type { Project } from "../types";

/**
 * Projects that are part of the portfolio build itself. Keeping these entries
 * in source makes the public project archive useful before the production
 * database has been populated through the admin screen.
 */
export const curatedProjects: Project[] = [
  {
    id: 9003,
    title: "FitQuest",
    description:
      "A mobile fitness app that turns home bodyweight workouts into a game. The phone camera and Google ML Kit pose detection count reps and check form in real time with spoken feedback. Workouts earn points, levels, streaks, and achievements, while friends, activity feeds, and shared challenges help users stay engaged.",
    image: "/images/projects/fitquest-home.png",
    images: [
      { id: 900301, project_id: 9003, image: "/images/projects/fitquest-login.png", caption: "FitQuest welcome and login" },
      { id: 900302, project_id: 9003, image: "/images/projects/fitquest-home.png", caption: "Home dashboard, workout activity, points, and streaks" },
      { id: 900303, project_id: 9003, image: "/images/projects/fitquest-exercises.png", caption: "Exercise library with 13 bodyweight movements" },
      { id: 900304, project_id: 9003, image: "/images/projects/fitquest-rewards.png", caption: "Rewards, levels, and workout achievements" },
      { id: 900305, project_id: 9003, image: "/images/projects/fitquest-social.png", caption: "Community, friends, activity, and challenges" },
    ],
    category: "Mobile Development",
    technologies:
      "React Native 0.81, Expo SDK 54, TypeScript, Expo Router, Zustand, React Context, AsyncStorage, Axios, react-native-vision-camera, Google ML Kit Pose Detection, Kotlin, Expo Speech, Expo Audio, Expo Haptics, react-native-svg, Expo Linear Gradient, @expo/vector-icons, Python, Flask, Flask-SQLAlchemy, SQLAlchemy 2, Flask-JWT-Extended, Flask-CORS, python-dotenv, SQLite, MySQL, PyMySQL, Gunicorn, Docker, Android Studio, Gradle, ESLint, Git",
    featured: 1,
    published: 1,
  },
  {
    id: 9004,
    title: "Co Pacific Distributors",
    description:
      "A commercial kitchen equipment and parts website rebuilt from a static site into WordPress, with an editable 32-brand, 211-product catalog, instant search, customer request flows, technical SEO, and a verified Hostinger deployment.",
    image: "/images/projects/copacific-home.jpg",
    category: "Web Development",
    technologies:
      "WordPress, PHP, MySQL, Elementor, JavaScript, HTML, CSS, Yoast SEO, Contact Form 7, Flamingo, WP-CLI, Hostinger, SSH/SFTP, Puppeteer",
    live_url: "https://copacific.org/",
    featured: 1,
    published: 1,
    images: [
      {
        id: 90031,
        project_id: 9004,
        image: "/images/projects/copacific-home.jpg",
        caption: "Responsive homepage and custom Co Pacific theme",
      },
      {
        id: 90032,
        project_id: 9004,
        image: "/images/projects/copacific-parts.jpg",
        caption: "Parts hub with brand discovery, model search, and category filters",
      },
      {
        id: 90033,
        project_id: 9004,
        image: "/images/projects/copacific-product.jpg",
        caption: "Product gallery, specifications, and parts-request actions",
      },
      {
        id: 90034,
        project_id: 9004,
        image: "/images/projects/copacific-contact.jpg",
        caption: "Parts-request form with equipment details and photo upload",
      },
      {
        id: 90035,
        project_id: 9004,
        image: "/images/projects/copacific-mobile.jpg",
        caption: "Mobile homepage with accessible navigation and quick contact actions",
      },
    ],
  },
  {
    id: 9001,
    title: "AgriGOV Agriculture Information System",
    description:
      "A municipality-aware agriculture operations platform that brings farmer records, GIS parcel mapping, assistance releases, animal-health services, cooperatives, machinery monitoring, reports, and audit trails into one secure Laravel system.",
    image: "/images/projects/agrigov-cover.jpg",
    images: [
      {
        id: 900101,
        project_id: 9001,
        image: "/images/projects/agrigov-landing.png",
        caption: "AgriGOV public landing page and farmer services",
      },
      {
        id: 900102,
        project_id: 9001,
        image: "/images/projects/agrigov-dashboard.png",
        caption: "Operations dashboard and agriculture assistance overview",
      },
      {
        id: 900103,
        project_id: 9001,
        image: "/images/projects/agrigov-parcel-map.png",
        caption: "GIS parcel map and municipality boundaries",
      },
    ],
    category: "Software Development",
    technologies:
      "Laravel, PHP, MySQL, Blade, Tailwind CSS, JavaScript, Google Maps, GIS",
    github_url: "https://github.com/vrash12/agri",
    featured: 1,
    published: 1,
  },
  {
    id: 9002,
    title: "Servalyn",
    description:
      "An editorial landing page for a digital studio offering websites, custom software, mobile apps, automation, AI solutions, and integrations, with interactive previews and an accessible project inquiry flow.",
    image: "/images/projects/servalyn-cover.png",
    category: "Web Development",
    technologies:
      "React, TypeScript, Vite, SSR pre-rendering, SEO, accessibility, CSS",
    featured: 1,
    published: 1,
  },
];

export function mergeCuratedProjects(projects: Project[]) {
  const existingTitles = new Set(
    projects.map((project) => project.title.trim().toLowerCase())
  );

  return [
    ...projects,
    ...curatedProjects.filter(
      (project) => !existingTitles.has(project.title.trim().toLowerCase())
    ),
  ];
}

export function getCuratedProject(id?: string | number | null) {
  const numericId = Number(id);

  return curatedProjects.find((project) => project.id === numericId);
}
