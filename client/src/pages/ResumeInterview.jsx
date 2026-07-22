import { useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "../styles/ResumeInterview.css";

function ResumeInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { interviewId } = useParams();

  const initialInterview =
    location.state?.interview || null;

  const [question, setQuestion] = useState(
    initialInterview?.question || ""
  );

  const [questionNumber, setQuestionNumber] =
    useState(
      initialInterview?.currentQuestionNumber || 1
    );

  const [totalQuestions] = useState(
    initialInterview?.totalQuestions || 5
  );

  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] =
    useState(null);
  const [finalReport, setFinalReport] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  const role =
    initialInterview?.role || "Selected Role";

  const difficulty =
    initialInterview?.difficulty || "Medium";

  const resumeFileName =
    initialInterview?.resumeFileName ||
    "Selected Resume";

  const progressPercentage = useMemo(() => {
    if (!totalQuestions) {
      return 0;
    }

    return Math.min(
      (questionNumber / totalQuestions) * 100,
      100
    );
  }, [questionNumber, totalQuestions]);

  async function submitAnswer(event) {
    event.preventDefault();

    try {
      setError("");
      setEvaluation(null);

      const trimmedAnswer = answer.trim();

      if (!trimmedAnswer) {
        throw new Error(
          "Please enter your answer before submitting."
        );
      }

      if (trimmedAnswer.length < 15) {
        throw new Error(
          "Please provide a more detailed answer."
        );
      }

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Please log in before continuing the interview."
        );
      }

      setSubmitting(true);

      const response = await fetch(
        `http://localhost:5000/api/resume-interview/${interviewId}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answer: trimmedAnswer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit your answer."
        );
      }

      setEvaluation(data.evaluation || null);

      if (data.isComplete) {
        setFinalReport(data.finalReport || null);
        setQuestion("");
        setAnswer("");
        return;
      }

      setQuestion(data.nextQuestion || "");
      setQuestionNumber(
        data.currentQuestionNumber ||
          questionNumber + 1
      );
      setAnswer("");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while submitting your answer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function scoreValue(value) {
    return Number(value || 0).toFixed(1);
  }

  function renderList(items, emptyMessage) {
    if (!Array.isArray(items) || items.length === 0) {
      return <p>{emptyMessage}</p>;
    }

    return (
      <ul
        style={{
          margin: "10px 0 0",
          paddingLeft: "22px",
          lineHeight: "1.7",
        }}
      >
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (!initialInterview && !finalReport) {
    return (
      <div className="resume-history-page">
        <div className="resume-history-container">
          <div className="resume-history-empty">
            <div className="empty-history-icon">
              ⚠️
            </div>

            <h2>Interview Details Not Available</h2>

            <p>
              Please start the interview again from the
              resume selection page.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/resume-interview-selection"
                )
              }
            >
              Choose Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (finalReport) {
    return (
      <div className="resume-history-page">
        <div className="resume-history-container">
          <div className="resume-history-header">
            <div>
              <p className="resume-history-label">
                Interview Completed
              </p>

              <h1>Final Interview Report</h1>

              <p>
                Review your performance, feedback and
                hiring recommendation.
              </p>
            </div>

            <div className="resume-history-actions">
              <button
                type="button"
                className="new-analysis-button"
                onClick={() =>
                  navigate(
                    "/resume-interview-selection"
                  )
                }
              >
                Start New Interview
              </button>

              <button
                type="button"
                className="clear-history-button"
                onClick={() =>
                  navigate("/dashboard")
                }
              >
                Dashboard
              </button>
            </div>
          </div>

          <div
            className="resume-history-card"
            style={{
              marginBottom: "24px",
            }}
          >
            <div className="resume-history-card-header">
              <div>
                <p className="resume-history-label">
                  Overall Performance
                </p>

                <h2>{finalReport.role}</h2>

                <p>
                  {finalReport.resumeFileName} ·{" "}
                  {finalReport.difficulty}
                </p>
              </div>

              <div
                style={{
                  minWidth: "120px",
                  textAlign: "center",
                  padding: "18px",
                  borderRadius: "16px",
                  background: "#eef2ff",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    marginBottom: "6px",
                  }}
                >
                  Overall Score
                </span>

                <strong
                  style={{
                    fontSize: "2rem",
                  }}
                >
                  {scoreValue(
                    finalReport.overallScore
                  )}
                  /10
                </strong>
              </div>
            </div>
          </div>

          <div className="resume-history-score-grid">
            <div className="resume-history-score">
              <span>Technical</span>
              <strong>
                {scoreValue(
                  finalReport.technicalScore
                )}
                /10
              </strong>
            </div>

            <div className="resume-history-score">
              <span>Communication</span>
              <strong>
                {scoreValue(
                  finalReport.communicationScore
                )}
                /10
              </strong>
            </div>

            <div className="resume-history-score">
              <span>Confidence</span>
              <strong>
                {scoreValue(
                  finalReport.confidenceScore
                )}
                /10
              </strong>
            </div>

            <div className="resume-history-score">
              <span>Answer Quality</span>
              <strong>
                {scoreValue(
                  finalReport.answerQualityScore
                )}
                /10
              </strong>
            </div>

            <div className="resume-history-score">
              <span>Resume Authenticity</span>
              <strong>
                {scoreValue(
                  finalReport.resumeAuthenticityScore
                )}
                /10
              </strong>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "22px",
              marginTop: "26px",
            }}
          >
            <section className="resume-history-card">
              <h2>Strengths</h2>

              {renderList(
                finalReport.strengths,
                "No strengths were provided."
              )}
            </section>

            <section className="resume-history-card">
              <h2>Areas for Improvement</h2>

              {renderList(
                finalReport.improvements,
                "No improvements were provided."
              )}
            </section>

            <section className="resume-history-card">
              <h2>Final Feedback</h2>

              <p
                style={{
                  lineHeight: "1.8",
                  marginTop: "12px",
                }}
              >
                {finalReport.finalFeedback ||
                  "No final feedback available."}
              </p>
            </section>

            <section className="resume-history-card">
              <p className="resume-history-label">
                Hiring Recommendation
              </p>

              <h2
                style={{
                  marginTop: "8px",
                }}
              >
                {finalReport.hiringRecommendation ||
                  "No recommendation available."}
              </h2>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-history-page">
      <div className="resume-history-container">
        <div className="resume-history-header">
          <div>
            <p className="resume-history-label">
              Resume-Based AI Interview
            </p>

            <h1>{role}</h1>

            <p>
              Resume: {resumeFileName} · Difficulty:{" "}
              {difficulty}
            </p>
          </div>

          <div className="resume-history-actions">
            <button
              type="button"
              className="clear-history-button"
              onClick={() =>
                navigate(
                  "/resume-interview-selection"
                )
              }
              disabled={submitting}
            >
              Exit Interview
            </button>
          </div>
        </div>

        {error && (
          <div className="resume-history-error">
            {error}
          </div>
        )}

        <div
          className="resume-history-card"
          style={{
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "10px",
            }}
          >
            <strong>
              Question {questionNumber} of{" "}
              {totalQuestions}
            </strong>

            <span>
              {Math.round(progressPercentage)}%
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#e5e7eb",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: "100%",
                background: "#6366f1",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {evaluation && (
          <section
            className="resume-history-card"
            style={{
              marginBottom: "24px",
            }}
          >
            <p className="resume-history-label">
              Previous Answer Evaluation
            </p>

            <h2>
              Score: {scoreValue(evaluation.score)}
              /10
            </h2>

            <div
              className="resume-history-score-grid"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="resume-history-score">
                <span>Technical</span>
                <strong>
                  {scoreValue(
                    evaluation.technicalScore
                  )}
                  /10
                </strong>
              </div>

              <div className="resume-history-score">
                <span>Communication</span>
                <strong>
                  {scoreValue(
                    evaluation.communicationScore
                  )}
                  /10
                </strong>
              </div>

              <div className="resume-history-score">
                <span>Confidence</span>
                <strong>
                  {scoreValue(
                    evaluation.confidenceScore
                  )}
                  /10
                </strong>
              </div>

              <div className="resume-history-score">
                <span>Answer Quality</span>
                <strong>
                  {scoreValue(
                    evaluation.answerQualityScore
                  )}
                  /10
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "18px",
                marginTop: "22px",
              }}
            >
              <div>
                <h3>Strengths</h3>
                <p>
                  {evaluation.strengths ||
                    "No strengths provided."}
                </p>
              </div>

              <div>
                <h3>Improvements</h3>
                <p>
                  {evaluation.improvements ||
                    "No improvements provided."}
                </p>
              </div>

              <div>
                <h3>Feedback</h3>
                <p>
                  {evaluation.feedback ||
                    "No feedback provided."}
                </p>
              </div>
            </div>
          </section>
        )}

        <form
          onSubmit={submitAnswer}
          className="resume-history-card"
        >
          <p className="resume-history-label">
            Current Question
          </p>

          <h2
            style={{
              lineHeight: "1.5",
              marginTop: "10px",
            }}
          >
            {question}
          </h2>

          <label
            style={{
              display: "grid",
              gap: "10px",
              marginTop: "24px",
            }}
          >
            <strong>Your Answer</strong>

            <textarea
              value={answer}
              onChange={(event) =>
                setAnswer(event.target.value)
              }
              placeholder="Explain your answer clearly and include examples from your resume, projects or experience."
              rows="9"
              disabled={submitting}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "15px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                fontSize: "1rem",
                lineHeight: "1.6",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "center",
              marginTop: "18px",
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
              }}
            >
              {answer.trim().length} characters
            </span>

            <button
              type="submit"
              className="new-analysis-button"
              disabled={
                submitting || !answer.trim()
              }
            >
              {submitting
                ? "Evaluating Answer..."
                : questionNumber === totalQuestions
                  ? "Submit Final Answer"
                  : "Submit Answer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResumeInterview;