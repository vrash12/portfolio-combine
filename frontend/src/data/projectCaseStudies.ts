import type { Project } from "../types";

export const PROJECT_OWNERSHIP_LABEL = "Sole Developer";
export const PROJECT_OWNERSHIP_STATEMENT =
  "Independently designed and developed the complete software implementation.";

export type ProjectCaseStudy = {
  matchTitle: string;
  projectId: number;
  fallbackImage: string;
  fallbackGithubUrl?: string;
  label: string;
  title: string;
  summary: string;
  problem: string;
  contribution: string;
  architecture: string;
  technologies: string[];
  capabilities: Array<{
    title: string;
    description: string;
  }>;
  delivery: string[];
  result: string;
  resultLabel: string;
  proofLabel: string;
};

export const flagshipCaseStudies: ProjectCaseStudy[] = [
  {
    matchTitle: "PGT Onboard",
    projectId: 11,
    fallbackImage: "1787360189802-fe4728fdd3e814b7f47ba680.png",
    label: "Award-winning mobility platform",
    title: "PGT Onboard",
    summary:
      "A connected public-transport platform that combines live vehicle tracking, passenger visibility, electronic ticketing, and daily fleet operations in one system.",
    problem:
      "Commuters lacked reliable arrival and occupancy information, while transport staff handled ticketing, top-ups, schedules, and vehicle monitoring through disconnected processes.",
    contribution:
      "I built the connected commuter and operations workflows, integrating live GPS and passenger data, ETA and schedule views, QR wallet ticketing, top-ups, announcements, and role-specific dashboards.",
    architecture:
      "React Native clients communicate with Flask services, MQTT carries live telemetry from Arduino-based bus hardware, and Google Maps turns location data into clear commuter and operations views.",
    technologies: [
      "React Native",
      "Flask",
      "Python",
      "MQTT",
      "Arduino",
      "Google Maps API",
    ],
    capabilities: [
      {
        title: "Live fleet visibility",
        description:
          "Shows vehicle locations, estimated arrival times, schedules, and passenger occupancy for better trip decisions.",
      },
      {
        title: "Digital fare journey",
        description:
          "Supports QR wallet payments, passenger top-ups, and staff ticket issuance in a connected flow.",
      },
      {
        title: "Operations control",
        description:
          "Gives transport teams tools for buses, schedules, announcements, ticketing activity, and sales monitoring.",
      },
      {
        title: "Connected hardware",
        description:
          "Streams GPS and passenger-count data from Arduino-based vehicle hardware through MQTT services.",
      },
    ],
    delivery: [
      "Role-separated commuter, teller, officer, and manager journeys",
      "Four recorded end-to-end demonstrations validate the core role flows",
      "Cloud-deployed backend connected to mobile clients and IoT hardware",
    ],
    result: "Best Capstone Project + 3rd Place",
    resultLabel:
      "Recognized at the 2026 university-wide STEM research competition",
    proofLabel: "View case study & 4 demos",
  },
  {
    matchTitle: "Barangay SOMS",
    projectId: 16,
    fallbackImage: "1787351715257-07e92bfed2c5386f9b4b4fd7.png",
    fallbackGithubUrl: "https://github.com/vrash12/barangay-repo",
    label: "Public-service operations platform",
    title: "Barangay SOMS",
    summary:
      "A secure Laravel service-operations system that brings resident records and front-line barangay services into one accountable, searchable workflow.",
    problem:
      "Resident, household, certificate, complaint, appointment, payment, and reporting records can become fragmented across paper files and separate spreadsheets, slowing service and weakening traceability.",
    contribution:
      "I designed and implemented the end-to-end system: resident-facing requests, staff processing, administrator controls, analytics, decision-support recommendations, notifications, reports, and exports.",
    architecture:
      "A Laravel 12 and MySQL application uses Blade, Tailwind CSS, Alpine.js, and Chart.js for responsive role-specific workflows, with scheduled jobs for notifications and dedicated reporting services.",
    technologies: [
      "Laravel 12",
      "PHP 8.2",
      "MySQL",
      "Tailwind CSS",
      "Alpine.js",
      "Chart.js",
    ],
    capabilities: [
      {
        title: "Resident records",
        description:
          "Organizes resident and household profiles while turning demographic data into useful administrative insights.",
      },
      {
        title: "Digital service requests",
        description:
          "Coordinates certificate requests, appointments, complaints, and their staff processing stages.",
      },
      {
        title: "Accountable operations",
        description:
          "Tracks transactions, notifications, reminders, permissions, and audit activity across user roles.",
      },
      {
        title: "Decision-ready reporting",
        description:
          "Provides recommendations, analytics, and PDF, CSV, and Excel exports for planning and reporting.",
      },
    ],
    delivery: [
      "Granular role and permission checks, inactivity timeout, and audit logging",
      "62 automated test methods across 20 test files cover access and service workflows",
      "Validated requests plus PDF, CSV, and Excel reporting and export paths",
    ],
    result: "8 service areas · 3 user groups",
    resultLabel:
      "One system for records, requests, appointments, complaints, finance, reports, and communications",
    proofLabel: "Explore implementation",
  },
  {
    matchTitle: "AmoraCare",
    projectId: 14,
    fallbackImage: "1784701416782-345718058-amor1.png",
    label: "Enterprise-style case management",
    title: "AmoraCare",
    summary:
      "A role-based adoption and donation platform that combines sensitive case operations with explainable, human-reviewed AI assistance.",
    problem:
      "Adoption work involves sensitive profiles, extensive document requirements, multi-stage reviews, matching decisions, donations, and legal guidance that are difficult to coordinate safely in disconnected tools.",
    contribution:
      "I developed the full-stack case, document, donation, reporting, and matching workflows, then integrated AI-assisted legal guidance and matching explanations without replacing human review.",
    architecture:
      "Laravel and MySQL manage operational data and role workflows. A separate Django REST service handles retrieval-assisted legal guidance and matching support through a containerized API deployed on Google Cloud Run.",
    technologies: [
      "Laravel",
      "MySQL",
      "Django REST",
      "Python",
      "OpenAI API",
      "Docker",
      "Google Cloud Run",
    ],
    capabilities: [
      {
        title: "Adoption case lifecycle",
        description:
          "Coordinates applications, child and parent profiles, review stages, notes, and case progress in one place.",
      },
      {
        title: "Controlled documents",
        description:
          "Manages requirements, verification, reviewer permissions, and protected document access for sensitive cases.",
      },
      {
        title: "Human-reviewed matching",
        description:
          "Combines deterministic matching scores with AI-supported explanations while keeping decisions with reviewers.",
      },
      {
        title: "Guidance and reporting",
        description:
          "Adds retrieval-assisted legal guidance, donation workflows, operational reports, and decision-support views.",
      },
    ],
    delivery: [
      "Protected admin, prospective-parent, and external-reviewer journeys",
      "Case-level reviewer authorization and controlled private-document access",
      "AI failures preserve deterministic scores and route decisions back to human review",
    ],
    result: "2 connected services · 3 protected journeys",
    resultLabel:
      "Operational case management and AI assistance remain separated, maintainable, and independently deployable",
    proofLabel: "Review system architecture",
  },
];

export function getProjectCaseStudy(
  project: Pick<Project, "id" | "title">
): ProjectCaseStudy | undefined {
  const normalizedTitle = project.title.toLowerCase();

  return flagshipCaseStudies.find(
    (caseStudy) =>
      project.id === caseStudy.projectId ||
      normalizedTitle.includes(caseStudy.matchTitle.toLowerCase())
  );
}

export function findProjectForCaseStudy(
  projects: Project[],
  caseStudy: ProjectCaseStudy
) {
  return projects.find(
    (project) =>
      project.id === caseStudy.projectId ||
      project.title
        .toLowerCase()
        .includes(caseStudy.matchTitle.toLowerCase())
  );
}

export function getPreferredProjectDescription(
  project: Pick<Project, "id" | "title" | "description">
) {
  return getProjectCaseStudy(project)?.summary || project.description;
}
