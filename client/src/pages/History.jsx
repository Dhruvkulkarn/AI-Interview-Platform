import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "../styles/History.css";

function History() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInterviewHistory() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/interviews",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          clearLoginData();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load interview history."
          );
        }

        setHistory(data.interviews || []);
      } catch (err) {
        setError(
          err.message || "Unable to load interview history."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInterviewHistory();
  }, [navigate]);

  function clearLoginData() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
  }

  async function deleteInterview(id) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this interview record?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/interviews/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        clearLoginData();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete interview."
        );
      }

      setHistory((currentHistory) =>
        currentHistory.filter(
          (interview) => interview._id !== id
        )
      );
    } catch (err) {
      window.alert(
        err.message || "Unable to delete interview."
      );
    }
  }

  async function clearAllHistory() {
    if (history.length === 0) {
      return;
    }

    const shouldClear = window.confirm(
      "Are you sure you want to delete all interview history?"
    );

    if (!shouldClear) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/interviews",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        clearLoginData();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to clear interview history."
        );
      }

      setHistory([]);
    } catch (err) {
      window.alert(
        err.message || "Unable to clear interview history."
      );
    }
  }

  function downloadInterviewReport(interview) {
    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const leftMargin = 20;
    const rightMargin = 20;
    const usableWidth = pageWidth - leftMargin - rightMargin;
    const bottomMargin = 20;

    let yPosition = 20;

    const role = formatRole(interview.role);

    const interviewDate = interview.createdAt
      ? new Date(interview.createdAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Unavailable";

    function addNewPageIfNeeded(requiredHeight = 20) {
      if (
        yPosition + requiredHeight >
        pageHeight - bottomMargin
      ) {
        pdf.addPage();
        yPosition = 20;
      }
    }

    function addWrappedText(
      text,
      fontSize = 11,
      spacingAfter = 5
    ) {
      pdf.setFontSize(fontSize);

      const lines = pdf.splitTextToSize(
        String(text || ""),
        usableWidth
      );

      const requiredHeight = lines.length * 6;

      addNewPageIfNeeded(requiredHeight);

      pdf.text(lines, leftMargin, yPosition);

      yPosition += requiredHeight + spacingAfter;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text(
      "AI Interview Performance Report",
      leftMargin,
      yPosition
    );

    yPosition += 14;

    pdf.setFont("helvetica", "normal");

    addWrappedText(`Candidate: ${getCandidateName()}`, 11, 2);
    addWrappedText(`Interview Role: ${role}`, 11, 2);
    addWrappedText(
      `Difficulty: ${interview.difficulty || "Not specified"}`,
      11,
      2
    );
    addWrappedText(`Completed On: ${interviewDate}`, 11, 2);
    addWrappedText(
      `Overall Score: ${Number(
        interview.overallScore || 0
      ).toFixed(1)}/10`,
      11,
      8
    );

    pdf.setDrawColor(180);
    pdf.line(
      leftMargin,
      yPosition,
      pageWidth - rightMargin,
      yPosition
    );

    yPosition += 12;

    const questions = Array.isArray(interview.questions)
      ? interview.questions
      : [];

    if (questions.length === 0) {
      addWrappedText(
        "No question details are available for this interview.",
        11
      );
    } else {
      questions.forEach((item, index) => {
        addNewPageIfNeeded(35);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(
          `Question ${index + 1}`,
          leftMargin,
          yPosition
        );

        yPosition += 9;

        pdf.setFont("helvetica", "bold");
        addWrappedText("Question:", 11, 1);

        pdf.setFont("helvetica", "normal");
        addWrappedText(
          item.question || "Question unavailable",
          11,
          5
        );

        pdf.setFont("helvetica", "bold");
        addWrappedText("Your Answer:", 11, 1);

        pdf.setFont("helvetica", "normal");
        addWrappedText(
          item.answer || "No answer provided",
          11,
          5
        );

        pdf.setFont("helvetica", "bold");
        addWrappedText("AI Feedback:", 11, 1);

        pdf.setFont("helvetica", "normal");
        addWrappedText(
          item.feedback || "No feedback available",
          11,
          5
        );

        pdf.setFont("helvetica", "bold");
        addWrappedText(
          `Question Score: ${Number(
            item.score || 0
          ).toFixed(1)}/10`,
          11,
          8
        );

        if (index < questions.length - 1) {
          addNewPageIfNeeded(10);

          pdf.setDrawColor(210);
          pdf.line(
            leftMargin,
            yPosition,
            pageWidth - rightMargin,
            yPosition
          );

          yPosition += 10;
        }
      });
    }

    const safeRoleName = role
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const dateForFilename = new Date()
      .toISOString()
      .slice(0, 10);

    pdf.save(
      `${safeRoleName || "interview"}-report-${dateForFilename}.pdf`
    );
  }

  function getCandidateName() {
    const username = localStorage.getItem("username");

    if (username) {
      return username;
    }

    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user")
      );

      return storedUser?.name || "Candidate";
    } catch {
      return "Candidate";
    }
  }

  const filteredHistory = history.filter((interview) => {
    const role = (interview.role || "").toLowerCase();
    const score = Number(interview.overallScore || 0);
    const normalizedSearch = searchText
      .toLowerCase()
      .trim();

    const matchesSearch =
      role.includes(normalizedSearch) ||
      (interview.difficulty || "")
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesRole =
      roleFilter === "all" || role === roleFilter;

    let matchesScore = true;

    if (scoreFilter === "excellent") {
      matchesScore = score >= 8;
    }

    if (scoreFilter === "good") {
      matchesScore = score >= 6 && score < 8;
    }

    if (scoreFilter === "needs-improvement") {
      matchesScore = score < 6;
    }

    return matchesSearch && matchesRole && matchesScore;
  });

  function getRoleIcon(role) {
    const normalizedRole = (role || "").toLowerCase();

    if (normalizedRole === "react") {
      return "⚛️";
    }

    if (normalizedRole === "java") {
      return "☕";
    }

    if (normalizedRole === "hr") {
      return "🧑‍💼";
    }

    return "💼";
  }

  function getScoreClass(score) {
    const numericScore = Number(score);

    if (numericScore >= 8) {
      return "score-excellent";
    }

    if (numericScore >= 6) {
      return "score-good";
    }

    return "score-low";
  }

  function formatRole(role) {
    if (!role) {
      return "Interview";
    }

    return (
      role.charAt(0).toUpperCase() +
      role.slice(1).toLowerCase()
    );
  }

  function formatInterviewDate(date) {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-container">
          <section className="history-empty-state">
            <span>⏳</span>
            <h2>Loading interview history...</h2>
            <p>Please wait while your records are loaded.</p>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="history-container">
          <section className="history-empty-state">
            <span>⚠️</span>
            <h2>Unable to load interview history</h2>
            <p>{error}</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        <section className="history-header">
          <div>
            <p className="history-label">
              Performance records
            </p>

            <h1>Interview History</h1>

            <p className="history-description">
              Review your previous interviews, scores and
              progress.
            </p>
          </div>

          <button
            type="button"
            className="clear-history-button"
            onClick={clearAllHistory}
            disabled={history.length === 0}
          >
            Clear All History
          </button>
        </section>

        <section className="history-summary">
          <div className="history-summary-card">
            <span>📝</span>

            <div>
              <p>Total Interviews</p>
              <h2>{history.length}</h2>
            </div>
          </div>

          <div className="history-summary-card">
            <span>🔎</span>

            <div>
              <p>Matching Results</p>
              <h2>{filteredHistory.length}</h2>
            </div>
          </div>
        </section>

        <section className="history-filters">
          <div className="history-search">
            <label htmlFor="history-search">
              Search interview
            </label>

            <input
              id="history-search"
              type="text"
              placeholder="Search React, Java, HR or difficulty..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />
          </div>

          <div className="history-filter-group">
            <label htmlFor="role-filter">Role</label>

            <select
              id="role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
            >
              <option value="all">All roles</option>
              <option value="react">React</option>
              <option value="java">Java</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div className="history-filter-group">
            <label htmlFor="score-filter">Score</label>

            <select
              id="score-filter"
              value={scoreFilter}
              onChange={(event) =>
                setScoreFilter(event.target.value)
              }
            >
              <option value="all">All scores</option>
              <option value="excellent">
                Excellent: 8–10
              </option>
              <option value="good">Good: 6–7.9</option>
              <option value="needs-improvement">
                Below 6
              </option>
            </select>
          </div>
        </section>

        {history.length === 0 ? (
          <section className="history-empty-state">
            <span>📭</span>

            <h2>No interview history found</h2>

            <p>
              Complete an interview and your result will appear
              here.
            </p>
          </section>
        ) : filteredHistory.length === 0 ? (
          <section className="history-empty-state">
            <span>🔍</span>

            <h2>No matching interviews</h2>

            <p>
              Try changing the search text or selected filters.
            </p>
          </section>
        ) : (
          <section className="history-list">
            {filteredHistory.map((interview) => (
              <article
                className="history-card"
                key={interview._id}
              >
                <div className="history-card-main">
                  <div className="history-role-icon">
                    {getRoleIcon(interview.role)}
                  </div>

                  <div className="history-card-content">
                    <div className="history-card-title">
                      <h2>
                        {formatRole(interview.role)} Interview
                      </h2>

                      <span
                        className={`history-score ${getScoreClass(
                          interview.overallScore
                        )}`}
                      >
                        {Number(
                          interview.overallScore || 0
                        ).toFixed(1)}
                        /10
                      </span>
                    </div>

                    <p className="history-date">
                      Completed on{" "}
                      {formatInterviewDate(
                        interview.createdAt
                      )}
                    </p>

                    <p className="history-date">
                      Difficulty:{" "}
                      {interview.difficulty ||
                        "Not specified"}
                    </p>

                    <p className="history-date">
                      Questions:{" "}
                      {interview.questions?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="history-actions">
                  <button
                    type="button"
                    className="download-report-button"
                    onClick={() =>
                      downloadInterviewReport(interview)
                    }
                  >
                    Download PDF
                  </button>

                  <button
                    type="button"
                    className="delete-history-button"
                    onClick={() =>
                      deleteInterview(interview._id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

export default History;