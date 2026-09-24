import { Link } from "react-router-dom";
import { getThumbnailUrl } from "../api/client";
import {
  findProjectForCaseStudy,
  flagshipCaseStudies,
  PROJECT_OWNERSHIP_LABEL,
  PROJECT_OWNERSHIP_STATEMENT,
} from "../data/projectCaseStudies";
import type { Project } from "../types";

type FlagshipCaseStudiesProps = {
  projects: Project[];
};

function FlagshipCaseStudies({ projects }: FlagshipCaseStudiesProps) {
  return (
    <section
      className="flagship-case-studies"
      aria-labelledby="flagship-case-studies-title"
    >
      <div className="flagship-heading">
        <div>
          <p className="section-kicker flagship-kicker">Selected Work</p>

          <h2 id="flagship-case-studies-title">
            Selected systems. <span>Practical impact.</span>
          </h2>
        </div>

        <p>
          From public transport to community services and care. Explore the
          systems, the decisions behind them, and what each build makes possible.
        </p>
      </div>

      <div className="flagship-list">
        {flagshipCaseStudies.map((caseStudy, index) => {
          const project = findProjectForCaseStudy(projects, caseStudy);
          const image =
            project?.image ||
            project?.images?.[0]?.image ||
            caseStudy.fallbackImage;
          const githubUrl =
            project?.github_url || caseStudy.fallbackGithubUrl || "";
          const projectId = project?.id || caseStudy.projectId;

          return (
            <article className="flagship-card" key={caseStudy.title}>
              <div className="flagship-visual">
                <div className="flagship-visual-placeholder" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{caseStudy.title}</strong>
                </div>

                {image && (
                  <img
                    src={getThumbnailUrl(image, 720)}
                    alt={`${caseStudy.title} project preview`}
                    className={index === 0 ? "flagship-image-contain" : undefined}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <div className="flagship-visual-topline">
                  <span>Case {String(index + 1).padStart(2, "0")}</span>
                  <span>{PROJECT_OWNERSHIP_LABEL}</span>
                </div>
              </div>

              <div className="flagship-content">
                <p className="flagship-label">{caseStudy.label}</p>
                <h3>{caseStudy.title}</h3>
                <p className="flagship-summary">{caseStudy.summary}</p>

                <div className="flagship-result-card">
                  <span className="flagship-result-mark" aria-hidden="true">
                    ↗
                  </span>
                  <strong>{caseStudy.result}</strong>
                </div>

                <div className="flagship-stack" aria-label="Technologies used">
                  {caseStudy.technologies.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>

                <div className="flagship-actions">
                  <Link
                    to={`/projects/${projectId}`}
                    className="flagship-case-link"
                    aria-label={`View ${caseStudy.title} case study`}
                  >
                    View case study <span aria-hidden="true">↗</span>
                  </Link>

                  {(githubUrl || project?.live_url) && (
                    <div className="flagship-secondary-links">
                      {githubUrl && (
                        <a
                          href={githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flagship-text-link"
                          aria-label={`${caseStudy.title} GitHub repository`}
                        >
                          GitHub <span aria-hidden="true">↗</span>
                        </a>
                      )}

                      {project?.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flagship-text-link"
                          aria-label={`${caseStudy.title} live system`}
                        >
                          Live system <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flagship-footer">
        <div className="flagship-ownership-note">
          <strong>My role across all three</strong>
          <p>{PROJECT_OWNERSHIP_STATEMENT}</p>
        </div>
        <Link to="/projects" className="btn flagship-all-projects-btn">
          Explore all projects <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}

export default FlagshipCaseStudies;
