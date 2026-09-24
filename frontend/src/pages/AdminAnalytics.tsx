import { useEffect, useState } from "react";
import { api } from "../api/client";

type AnalyticsItem = {
  id?: number;
  label?: string;
  name?: string;
  page?: string;
  path?: string;
  href?: string;
  clicks?: number;
  count?: number;
  total?: number;
  created_at?: string;
  updated_at?: string;
};

function getItemLabel(item: AnalyticsItem) {
  return item.label || item.name || item.page || item.path || item.href || "Unknown";
}

function getItemCount(item: AnalyticsItem) {
  return Number(item.clicks || item.count || item.total || 0);
}

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [rawData, setRawData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/admin/analytics/nav-clicks");

      setRawData(response.data);

      if (Array.isArray(response.data)) {
        setAnalytics(response.data);
        return;
      }

      if (Array.isArray(response.data?.data)) {
        setAnalytics(response.data.data);
        return;
      }

      if (Array.isArray(response.data?.items)) {
        setAnalytics(response.data.items);
        return;
      }

      if (Array.isArray(response.data?.analytics)) {
        setAnalytics(response.data.analytics);
        return;
      }

      setAnalytics([]);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setErrorMessage(
        "Unable to load analytics. Please make sure you are logged in as admin."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalClicks = analytics.reduce((sum, item) => {
    return sum + getItemCount(item);
  }, 0);

  const highestCount = Math.max(
    ...analytics.map((item) => getItemCount(item)),
    1
  );

  return (
    <main className="admin-analytics-page">
      <section className="page-hero blog-adventure-hero">
        <p className="section-kicker">Admin Analytics</p>

        <h1>Site Activity</h1>

        <p>
          View navigation clicks and visitor interaction data from your portfolio
          website.
        </p>
      </section>

      <section className="content-section">
        <div className="analytics-dashboard-header">
          <div>
            <h2>Navigation Clicks</h2>
            <p>
              This shows which navigation items or pages visitors interact with
              the most.
            </p>
          </div>

          <button type="button" className="btn" onClick={fetchAnalytics}>
            Refresh
          </button>
        </div>

        <div className="analytics-summary-grid">
          <article className="analytics-summary-card">
            <span>Total Clicks</span>
            <strong>{totalClicks}</strong>
          </article>

          <article className="analytics-summary-card">
            <span>Tracked Items</span>
            <strong>{analytics.length}</strong>
          </article>

          <article className="analytics-summary-card">
            <span>Status</span>
            <strong>{loading ? "Loading" : "Live"}</strong>
          </article>
        </div>

        {loading ? (
          <div className="analytics-message-card">
            <p>Loading analytics...</p>
          </div>
        ) : errorMessage ? (
          <div className="analytics-message-card error">
            <p>{errorMessage}</p>
          </div>
        ) : analytics.length === 0 ? (
          <div className="analytics-message-card">
            <p>No analytics data found yet.</p>
          </div>
        ) : (
          <div className="analytics-list">
            {analytics.map((item, index) => {
              const label = getItemLabel(item);
              const count = getItemCount(item);
              const percentage = Math.max((count / highestCount) * 100, 4);

              return (
                <article className="analytics-row-card" key={`${label}-${index}`}>
                  <div className="analytics-row-top">
                    <div>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <h3>{label}</h3>
                    </div>

                    <strong>{count}</strong>
                  </div>

                  <div className="analytics-bar">
                    <div style={{ width: `${percentage}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <details className="analytics-raw-card">
          <summary>View raw API response</summary>

          <pre>{JSON.stringify(rawData, null, 2)}</pre>
        </details>
      </section>
    </main>
  );
}

export default AdminAnalytics;