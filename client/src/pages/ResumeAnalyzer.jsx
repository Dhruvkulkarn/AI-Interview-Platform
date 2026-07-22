import { useRef, useState } from "react";
import "../styles/ResumeAnalyzer.css";

function ResumeAnalyzer() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  function validateFile(file) {
    if (!file) {
      return false;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF resume files are allowed.");
      return false;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setError("The PDF must be smaller than 5 MB.");
      return false;
    }

    setError("");
    return true;
  }

  function selectFile(file) {
    if (!validateFile(file)) {
      setSelectedFile(null);
      setAnalysis(null);
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setError("");
  }

  function handleFileInput(event) {
    const file = event.target.files?.[0];
    selectFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    selectFile(file);
  }

  function openFileSelector() {
    fileInputRef.current?.click();
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    setAnalysis(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function formatFileSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    }

    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function analyzeResume() {
    if (!selectedFile) {
      setError("Please select your resume before analyzing.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setAnalysis(null);

      const formData = new FormData();
      formData.append("resume", selectedFile);

      const token = localStorage.getItem("token");

if (!token) {
  throw new Error(
    "Please log in before analyzing your resume."
  );
}

const response = await fetch(
  "http://https://ai-interview-platform-5e0s.onrender.com/api/resume/analyze",
  {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: formData,
  }
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to analyze the resume."
        );
      }

      if (!data.analysis) {
        throw new Error(
          "Resume analysis was not returned by the server."
        );
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(
        err.message || "Something went wrong while analyzing."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function renderList(items, emptyMessage) {
    if (!Array.isArray(items) || items.length === 0) {
      return <p className="empty-analysis-text">{emptyMessage}</p>;
    }

    return (
      <ul className="analysis-list">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  }

  const atsScore = Number(analysis?.atsScore || 0);
  const overallRating = Number(
    analysis?.overallRating || 0
  );
  const interviewReadiness = Number(
    analysis?.interviewReadinessScore || 0
  );

  return (
    <div className="resume-analyzer-page">
      <div className="resume-analyzer-container">
        <section className="resume-analyzer-header">
          <p className="resume-analyzer-label">
            AI Career Assistant
          </p>

          <h1>Resume Analyzer</h1>

          <p>
            Upload your resume and receive an AI-powered ATS
            score, skill analysis, job recommendations and
            improvement suggestions.
          </p>
        </section>

        <section className="resume-upload-card">
          <div
            className={`resume-drop-zone ${
              dragging ? "resume-drop-zone-active" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileSelector}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                openFileSelector();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileInput}
              className="resume-file-input"
            />

            <div className="resume-upload-icon">📄</div>

            <h2>
              {dragging
                ? "Drop your resume here"
                : "Upload your resume"}
            </h2>

            <p>
              Drag and drop a PDF here, or click to browse.
            </p>

            <span>Maximum file size: 5 MB</span>
          </div>

          {selectedFile && (
            <div className="selected-resume-card">
              <div className="selected-resume-information">
                <span className="selected-resume-icon">📑</span>

                <div>
                  <h3>{selectedFile.name}</h3>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>

              <button
                type="button"
                className="remove-resume-button"
                onClick={removeSelectedFile}
                disabled={analyzing}
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="resume-error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="button"
            className="analyze-resume-button"
            onClick={analyzeResume}
            disabled={!selectedFile || analyzing}
          >
            {analyzing
              ? "Analyzing Resume..."
              : "Analyze Resume"}
          </button>
        </section>

        {analyzing && (
          <section className="resume-loading-card">
            <div className="resume-loading-spinner"></div>

            <h2>AI is reviewing your resume...</h2>

            <p>
              Checking ATS compatibility, skills, experience and
              improvement areas.
            </p>
          </section>
        )}

        {analysis && !analyzing && (
          <section className="resume-analysis-results">
            <div className="analysis-results-heading">
              <div>
                <p className="resume-results-label">
                  Analysis complete
                </p>

                <h2>Your Resume Report</h2>
              </div>

              <span className="resume-success-badge">
                AI Reviewed
              </span>
            </div>

            <div className="score-grid">
              <article className="score-card primary-score-card">
                <p>ATS Score</p>
                <h3>{atsScore}%</h3>

                <div className="score-progress">
                  <div
                    className="score-progress-fill"
                    style={{ width: `${atsScore}%` }}
                  ></div>
                </div>

                <span>
                  {atsScore >= 80
                    ? "Strong ATS compatibility"
                    : atsScore >= 60
                    ? "Good, but improvements are needed"
                    : "Needs important ATS improvements"}
                </span>
              </article>

              <article className="score-card">
                <p>Overall Rating</p>
                <h3>{overallRating.toFixed(1)}/10</h3>
                <span>Overall resume quality</span>
              </article>

              <article className="score-card">
                <p>Interview Readiness</p>
                <h3>{interviewReadiness.toFixed(1)}/10</h3>
                <span>Preparation for job interviews</span>
              </article>
            </div>

            <article className="analysis-summary-card">
              <div className="analysis-card-title">
                <span>🧑‍💼</span>
                <h3>Professional Summary</h3>
              </div>

              <p>
                {analysis.professionalSummary ||
                  "No summary was provided."}
              </p>
            </article>

            <div className="analysis-grid">
              <article className="analysis-card strengths-card">
                <div className="analysis-card-title">
                  <span>✅</span>
                  <h3>Strengths</h3>
                </div>

                {renderList(
                  analysis.strengths,
                  "No strengths were identified."
                )}
              </article>

              <article className="analysis-card weaknesses-card">
                <div className="analysis-card-title">
                  <span>⚠️</span>
                  <h3>Weaknesses</h3>
                </div>

                {renderList(
                  analysis.weaknesses,
                  "No major weaknesses were identified."
                )}
              </article>

              <article className="analysis-card skills-card">
                <div className="analysis-card-title">
                  <span>🛠️</span>
                  <h3>Missing Skills</h3>
                </div>

                {renderList(
                  analysis.missingSkills,
                  "No important missing skills were identified."
                )}
              </article>

              <article className="analysis-card suggestions-card">
                <div className="analysis-card-title">
                  <span>📈</span>
                  <h3>Improvement Suggestions</h3>
                </div>

                {renderList(
                  analysis.improvementSuggestions,
                  "No improvement suggestions were provided."
                )}
              </article>

              <article className="analysis-card roles-card">
                <div className="analysis-card-title">
                  <span>💼</span>
                  <h3>Best Job Roles</h3>
                </div>

                {renderList(
                  analysis.bestJobRoles,
                  "No job roles were recommended."
                )}
              </article>

              <article className="analysis-card keywords-card">
                <div className="analysis-card-title">
                  <span>🔑</span>
                  <h3>ATS Keywords</h3>
                </div>

                {renderList(
                  analysis.keywordSuggestions,
                  "No keyword suggestions were provided."
                )}
              </article>
            </div>

            <button
              type="button"
              className="analyze-another-button"
              onClick={removeSelectedFile}
            >
              Analyze Another Resume
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzer;