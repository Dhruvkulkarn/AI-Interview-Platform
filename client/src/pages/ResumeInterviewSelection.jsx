import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResumeHistory.css";
import "../styles/ResumeInterview.css";

function ResumeInterviewSelection() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResumeHistory();

    const savedUser = localStorage.getItem("user");
    const savedUsername = localStorage.getItem("username");

    if (savedUsername) {
      setCandidateName(savedUsername);
      return;
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setCandidateName(
          parsedUser.name || parsedUser.username || ""
        );
      } catch {
        setCandidateName("");
      }
    }
  }, []);

  async function loadResumeHistory() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://https://ai-interview-platform-5e0s.onrender.com/api/resume/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("username");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load your resume reports."
        );
      }

      const resumeReports = Array.isArray(data.analyses)
        ? data.analyses
        : [];

      setAnalyses(resumeReports);

      if (resumeReports.length > 0) {
        const firstResume = resumeReports[0];

        setSelectedResumeId(firstResume._id);

        if (
          Array.isArray(firstResume.bestJobRoles) &&
          firstResume.bestJobRoles.length > 0
        ) {
          setTargetRole(firstResume.bestJobRoles[0]);
        }
      }
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while loading resumes."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleResumeSelection(resumeId) {
    if (starting) {
      return;
    }

    setSelectedResumeId(resumeId);
    setError("");

    const selectedResume = analyses.find(
      (analysis) => analysis._id === resumeId
    );

    if (
      selectedResume &&
      Array.isArray(selectedResume.bestJobRoles) &&
      selectedResume.bestJobRoles.length > 0
    ) {
      setTargetRole(selectedResume.bestJobRoles[0]);
    }
  }

  function handleResumeKeyDown(event, resumeId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleResumeSelection(resumeId);
    }
  }

  async function startInterview(event) {
    event.preventDefault();

    try {
      setError("");

      if (!selectedResumeId) {
        throw new Error("Please select a resume.");
      }

      if (!candidateName.trim()) {
        throw new Error("Please enter the candidate name.");
      }

      if (!targetRole.trim()) {
        throw new Error("Please enter your target job role.");
      }

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setStarting(true);

      const response = await fetch(
        "http://https://ai-interview-platform-5e0s.onrender.com/api/resume-interview/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resumeId: selectedResumeId,
            candidateName: candidateName.trim(),
            targetRole: targetRole.trim(),
            difficulty,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("username");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to start the resume interview."
        );
      }

      if (!data.interview?.id) {
        throw new Error(
          "The server did not return an interview ID."
        );
      }

      navigate(`/resume-interview/${data.interview.id}`, {
        state: {
          interview: data.interview,
        },
      });
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while starting the interview."
      );
    } finally {
      setStarting(false);
    }
  }

  function formatDate(date) {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getResumeRole(analysis) {
    if (
      Array.isArray(analysis.bestJobRoles) &&
      analysis.bestJobRoles.length > 0
    ) {
      return analysis.bestJobRoles[0];
    }

    return "Software Developer";
  }

  function getDisplayFileName(analysis) {
    return analysis.fileName || "Analyzed Resume";
  }

  const selectedResume = analyses.find(
    (analysis) => analysis._id === selectedResumeId
  );

  return (
    <div className="resume-history-page resume-selection-page">
      <div className="resume-history-container">
        <header className="resume-history-header">
          <div>
            <p className="resume-history-label">
              Personalized Interview
            </p>

            <h1>Choose Your Resume</h1>

            <p>
              Select an analyzed resume and configure your
              personalized AI interview.
            </p>
          </div>

          <div className="resume-history-actions">
            <button
              type="button"
              className="clear-history-button"
              onClick={() => navigate("/dashboard")}
              disabled={starting}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="new-analysis-button"
              onClick={() => navigate("/resume-analyzer")}
              disabled={starting}
            >
              Analyze New Resume
            </button>
          </div>
        </header>

        <section className="resume-selection-intro">
          <div className="resume-selection-step">
            <span>1</span>

            <div>
              <strong>Select a resume</strong>
              <p>Choose one of your analyzed resumes.</p>
            </div>
          </div>

          <div className="resume-selection-step">
            <span>2</span>

            <div>
              <strong>Configure interview</strong>
              <p>Enter your target role and difficulty.</p>
            </div>
          </div>

          <div className="resume-selection-step">
            <span>3</span>

            <div>
              <strong>Begin interview</strong>
              <p>Answer five personalized AI questions.</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="resume-history-error" role="alert">
            <strong>Unable to continue</strong>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="resume-history-loading">
            <div className="resume-history-spinner" />

            <h2>Loading your resumes...</h2>

            <p>
              Please wait while we retrieve your analyzed resume
              reports.
            </p>
          </div>
        )}

        {!loading && analyses.length === 0 && (
          <div className="resume-history-empty">
            <div className="empty-history-icon">📄</div>

            <h2>No Analyzed Resume Found</h2>

            <p>
              Analyze a resume before starting a resume-based
              interview.
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
          <form onSubmit={startInterview}>
            <section className="resume-selection-section">
              <div className="resume-selection-heading">
                <div>
                  <p className="resume-history-label">
                    Step 1
                  </p>

                  <h2>Select an Analyzed Resume</h2>
                </div>

                <span>
                  {analyses.length}{" "}
                  {analyses.length === 1 ? "resume" : "resumes"}{" "}
                  available
                </span>
              </div>

              <div className="resume-history-grid">
                {analyses.map((analysis) => {
                  const isSelected =
                    analysis._id === selectedResumeId;

                  return (
                    <article
                      key={analysis._id}
                      className={`resume-history-card resume-selection-card ${
                        isSelected
                          ? "resume-selection-card-selected"
                          : ""
                      }`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() =>
                        handleResumeSelection(analysis._id)
                      }
                      onKeyDown={(event) =>
                        handleResumeKeyDown(
                          event,
                          analysis._id
                        )
                      }
                    >
                      <div className="resume-history-card-header">
                        <div className="resume-file-details">
                          <span className="resume-file-icon">
                            📄
                          </span>

                          <div>
                            <h2>
                              {getDisplayFileName(analysis)}
                            </h2>

                            <p>
                              Analyzed on{" "}
                              {formatDate(analysis.createdAt)}
                            </p>
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="selectedResume"
                          value={analysis._id}
                          checked={isSelected}
                          onChange={() =>
                            handleResumeSelection(analysis._id)
                          }
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          disabled={starting}
                          aria-label={`Select ${getDisplayFileName(
                            analysis
                          )}`}
                        />
                      </div>

                      <div className="resume-history-score-grid">
                        <div className="resume-history-score">
                          <span>ATS Score</span>

                          <strong>
                            {Number(analysis.atsScore || 0)}%
                          </strong>
                        </div>

                        <div className="resume-history-score">
                          <span>Interview Ready</span>

                          <strong>
                            {Number(
                              analysis.interviewReadinessScore ||
                                0
                            ).toFixed(1)}
                            /10
                          </strong>
                        </div>

                        <div className="resume-history-score">
                          <span>Suggested Role</span>

                          <strong className="resume-role-value">
                            {getResumeRole(analysis)}
                          </strong>
                        </div>
                      </div>

                      <div className="resume-history-summary">
                        <h3>Professional Summary</h3>

                        <p>
                          {analysis.professionalSummary ||
                            "No professional summary available."}
                        </p>
                      </div>

                      <div
                        className={`resume-selection-status ${
                          isSelected
                            ? "resume-selection-status-active"
                            : ""
                        }`}
                      >
                        {isSelected
                          ? "✓ Selected for interview"
                          : "Click to select this resume"}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {selectedResume && (
              <section className="resume-history-card resume-interview-setup-card">
                <div className="resume-history-card-header">
                  <div>
                    <p className="resume-history-label">
                      Step 2
                    </p>

                    <h2>Configure Your Interview</h2>

                    <p>
                      The AI will ask five questions based on your
                      selected resume.
                    </p>
                  </div>

                  <div className="selected-resume-summary">
                    <span>Selected resume</span>

                    <strong>
                      {getDisplayFileName(selectedResume)}
                    </strong>
                  </div>
                </div>

                <div className="resume-interview-form-grid">
                  <label className="resume-interview-field">
                    <span>Candidate Name</span>

                    <input
                      type="text"
                      value={candidateName}
                      onChange={(event) =>
                        setCandidateName(event.target.value)
                      }
                      placeholder="Enter your name"
                      required
                      disabled={starting}
                      autoComplete="name"
                    />
                  </label>

                  <label className="resume-interview-field">
                    <span>Target Job Role</span>

                    <input
                      type="text"
                      value={targetRole}
                      onChange={(event) =>
                        setTargetRole(event.target.value)
                      }
                      placeholder="Example: React Developer"
                      required
                      disabled={starting}
                    />
                  </label>

                  <label className="resume-interview-field">
                    <span>Difficulty</span>

                    <select
                      value={difficulty}
                      onChange={(event) =>
                        setDifficulty(event.target.value)
                      }
                      disabled={starting}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </label>
                </div>

                <div className="resume-interview-setup-note">
                  <span>💡</span>

                  <p>
                    Give detailed answers using examples from
                    your projects, skills and experience for
                    better evaluation.
                  </p>
                </div>

                <button
                  type="submit"
                  className="new-analysis-button resume-start-button"
                  disabled={
                    starting ||
                    !selectedResumeId ||
                    !candidateName.trim() ||
                    !targetRole.trim()
                  }
                >
                  {starting
                    ? "Preparing Your Interview..."
                    : "Start Resume Interview"}
                </button>
              </section>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default ResumeInterviewSelection;