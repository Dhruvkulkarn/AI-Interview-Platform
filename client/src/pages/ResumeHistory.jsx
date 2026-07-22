import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResumeHistory.css";

function ResumeHistory() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResumeHistory();
  }, []);

  async function fetchResumeHistory() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to view resume history.");
      }

      const response = await fetch(
        "https://ai-interview-platform-5e0s.onrender.com/api/resume/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load resume history."
        );
      }

      setAnalyses(data.analyses || []);
    } catch (err) {
      setError(
        err.message || "Something went wrong while loading history."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnalysis(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume report?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://ai-interview-platform-5e0s.onrender.com/api/resume/history/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete the report."
        );
      }

      setAnalyses((currentAnalyses) =>
        currentAnalyses.filter(
          (analysis) => analysis._id !== id
        )
      );
    } catch (err) {
      setError(
        err.message || "Something went wrong while deleting."
      );
    } finally {
      setDeletingId("");
    }
  }

  async function clearHistory() {
    const confirmed = window.confirm(
      "Delete all saved resume reports? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://ai-interview-platform-5e0s.onrender.com/api/resume/history",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to clear resume history."
        );
      }

      setAnalyses([]);
    } catch (err) {
      setError(
        err.message || "Something went wrong while clearing history."
      );
    }
  }

  function formatDate(date) {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getAtsLabel(score) {
    if (score >= 80) {
      return "Strong";
    }

    if (score >= 60) {
      return "Good";
    }

    return "Needs Improvement";
  }

  return (
    <div className="resume-history-page">
      <div className="resume-history-container">
        <div className="resume-history-header">
          <div>
            <p className="resume-history-label">
              Saved Reports
            </p>

            <h1>Resume History</h1>

            <p>
              Review previous AI resume analyses and reopen full
              reports.
            </p>
          </div>

          <div className="resume-history-actions">
            <button
              type="button"
              className="new-analysis-button"
              onClick={() => navigate("/resume-analyzer")}
            >
              Analyze New Resume
            </button>

            {analyses.length > 0 && (
              <button
                type="button"
                className="clear-history-button"
                onClick={clearHistory}
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="resume-history-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="resume-history-loading">
            <div className="resume-history-spinner"></div>
            <h2>Loading resume reports...</h2>
          </div>
        )}

        {!loading && analyses.length === 0 && (
          <div className="resume-history-empty">
            <div className="empty-history-icon">📄</div>
            <h2>No Resume Reports Yet</h2>
            <p>
              Analyze your first resume to create a saved report.
            </p>

            <button
              type="button"
              onClick={() => navigate("/resume-analyzer")}
            >
              Analyze Resume
            </button>
          </div>
        )}

        {!loading && analyses.length > 0 && (
          <div className="resume-history-grid">
            {analyses.map((analysis) => (
              <article
                className="resume-history-card"
                key={analysis._id}
              >
                <div className="resume-history-card-header">
                  <div className="resume-file-details">
                    <span className="resume-file-icon">
                      📄
                    </span>

                    <div>
                      <h2>{analysis.fileName}</h2>
                      <p>
                        Analyzed on{" "}
                        {formatDate(analysis.createdAt)}
                      </p>
                    </div>
                  </div>

                  <span className="ats-status-badge">
                    {getAtsLabel(analysis.atsScore)}
                  </span>
                </div>

                <div className="resume-history-score-grid">
                  <div className="resume-history-score">
                    <span>ATS Score</span>
                    <strong>
                      {Number(analysis.atsScore || 0)}%
                    </strong>
                  </div>

                  <div className="resume-history-score">
                    <span>Overall Rating</span>
                    <strong>
                      {Number(
                        analysis.overallRating || 0
                      ).toFixed(1)}
                      /10
                    </strong>
                  </div>

                  <div className="resume-history-score">
                    <span>Interview Ready</span>
                    <strong>
                      {Number(
                        analysis.interviewReadinessScore || 0
                      ).toFixed(1)}
                      /10
                    </strong>
                  </div>
                </div>

                <div className="resume-history-summary">
                  <h3>Summary</h3>
                  <p>
                    {analysis.professionalSummary ||
                      "No summary available."}
                  </p>
                </div>

                <div className="resume-history-card-actions">
                  <button
                    type="button"
                    className="view-report-button"
                    onClick={() =>
                      navigate(
                        `/resume-history/${analysis._id}`
                      )
                    }
                  >
                    View Report
                  </button>

                  <button
                    type="button"
                    className="delete-report-button"
                    onClick={() =>
                      deleteAnalysis(analysis._id)
                    }
                    disabled={deletingId === analysis._id}
                  >
                    {deletingId === analysis._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeHistory;