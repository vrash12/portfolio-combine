import type { Project } from "../types";

/**
 * Projects that are part of the portfolio build itself. Keeping these entries
 * in source makes the public project archive useful before the production
 * database has been populated through the admin screen.
 */
export const curatedProjects: Project[] = [
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
