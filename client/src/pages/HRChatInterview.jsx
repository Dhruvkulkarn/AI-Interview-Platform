import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HRChatInterview.css";

const API_BASE_URL = "http://localhost:5000";
const TOTAL_QUESTIONS = 5;

function HRChatInterview() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const hasStartedRef = useRef(false);

  const [candidateName, setCandidateName] = useState(
    localStorage.getItem("username") || "Candidate"
  );

  const [messages, setMessages] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState("");

  const [starting, setStarting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isComplete, setIsComplete] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [savedInterviewId, setSavedInterviewId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    startInterview();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, submitting, isComplete]);

  async function startInterview() {
    try {
      setStarting(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr-chat/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            candidateName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to start the AI HR interview."
        );
      }

      const interview = data.interview || {};
      const firstQuestion =
        interview.firstQuestion ||
        "Please introduce yourself and tell me about your education, skills and career goals.";

      setCandidateName(interview.candidateName || candidateName);
      setQuestionNumber(
        Number(interview.currentQuestionNumber || 1)
      );
      setCurrentQuestion(firstQuestion);

      setMessages([
        {
          id: createMessageId(),
          sender: "ai",
          text: `Hello ${
            interview.candidateName || candidateName
          }. I will conduct a five-question HR interview. Answer naturally and include examples wherever possible.`,
          type: "intro",
        },
        {
          id: createMessageId(),
          sender: "ai",
          text: firstQuestion,
          type: "question",
          questionNumber: 1,
        },
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while starting the interview."
      );
    } finally {
      setStarting(false);
    }
  }

  function createMessageId() {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  function buildConversationForApi(extraMessages = []) {
    return [...messages, ...extraMessages].map((message) => ({
      sender: message.sender,
      text: message.text,
    }));
  }

  function getScoreLabel(score) {
    const numericScore = Number(score || 0);

    if (numericScore >= 8) {
      return "Excellent";
    }

    if (numericScore >= 6) {
      return "Good";
    }

    if (numericScore >= 4) {
      return "Developing";
    }

    return "Needs practice";
  }

  async function submitAnswer(event) {
    event?.preventDefault();

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setError("Please type your answer before sending.");
      return;
    }

    if (trimmedAnswer.length < 10) {
      setError(
        "Please give a slightly more detailed answer before sending."
      );
      return;
    }

    if (
      submitting ||
      isComplete ||
      !currentQuestion ||
      questionNumber < 1
    ) {
      return;
    }

    const userMessage = {
      id: createMessageId(),
      sender: "user",
      text: trimmedAnswer,
      type: "answer",
      questionNumber,
    };

    try {
      setSubmitting(true);
      setError("");
      setAnswer("");
      setMessages((previous) => [
        ...previous,
        userMessage,
      ]);

      const response = await fetch(
        `${API_BASE_URL}/api/hr-chat/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            candidateName,
            question: currentQuestion,
            answer: trimmedAnswer,
            questionNumber,
            conversation: buildConversationForApi([
              userMessage,
            ]),
            previousEvaluations: evaluations,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "The AI interviewer could not respond."
        );
      }

      const evaluation = {
        ...(data.evaluation || {}),
        question: currentQuestion,
        answer: trimmedAnswer,
      };

      const updatedEvaluations = [
        ...evaluations,
        evaluation,
      ];

      setEvaluations(updatedEvaluations);

      const replyMessages = [];

      if (evaluation.interviewerReply) {
        replyMessages.push({
          id: createMessageId(),
          sender: "ai",
          text: evaluation.interviewerReply,
          type: "reply",
        });
      }

      replyMessages.push({
        id: createMessageId(),
        sender: "ai",
        text: `Score: ${Number(
          evaluation.score || 0
        ).toFixed(1)}/10\n\nStrength: ${
          evaluation.strengths ||
          "Your answer was relevant."
        }\n\nImprove: ${
          evaluation.improvements ||
          "Add a clear example and more detail."
        }`,
        type: "feedback",
        score: Number(evaluation.score || 0),
      });

      if (data.isComplete) {
        setIsComplete(true);
        setFinalReport(data.finalReport || null);
        setCurrentQuestion("");

        replyMessages.push({
          id: createMessageId(),
          sender: "ai",
          text: "The interview is complete. I have prepared your final performance report below.",
          type: "complete",
        });

        setMessages((previous) => [
          ...previous,
          ...replyMessages,
        ]);

        await saveCompletedInterview(
          updatedEvaluations,
          data.finalReport
        );
      } else {
        const nextQuestion =
          data.nextQuestion ||
          "Can you describe a challenge you faced and how you handled it?";

        const nextQuestionNumber = questionNumber + 1;

        setQuestionNumber(nextQuestionNumber);
        setCurrentQuestion(nextQuestion);

        replyMessages.push({
          id: createMessageId(),
          sender: "ai",
          text: nextQuestion,
          type: "question",
          questionNumber: nextQuestionNumber,
        });

        setMessages((previous) => [
          ...previous,
          ...replyMessages,
        ]);
      }
    } catch (err) {
      setAnswer(trimmedAnswer);
      setMessages((previous) =>
        previous.filter(
          (message) => message.id !== userMessage.id
        )
      );

      setError(
        err.message ||
          "Unable to continue the interview. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function saveCompletedInterview(
    completedEvaluations,
    report
  ) {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your login session was not found. Please log in again."
        );
      }

      const questions = completedEvaluations.map(
        (evaluation) => ({
          question: evaluation.question,
          answer: evaluation.answer,
          feedback: [
            `Strengths: ${
              evaluation.strengths ||
              "The answer was relevant."
            }`,
            `Areas to improve: ${
              evaluation.improvements ||
              "Add more detail and a clear example."
            }`,
            `Communication score: ${Number(
              evaluation.communicationScore || 0
            ).toFixed(1)}/10`,
            `Confidence score: ${Number(
              evaluation.confidenceScore || 0
            ).toFixed(1)}/10`,
            `Professionalism score: ${Number(
              evaluation.professionalismScore || 0
            ).toFixed(1)}/10`,
            `Answer quality score: ${Number(
              evaluation.answerQualityScore || 0
            ).toFixed(1)}/10`,
          ].join("\n"),
          score: Number(evaluation.score || 0),
        })
      );

      const calculatedAverage =
        questions.length > 0
          ? questions.reduce(
              (total, item) =>
                total + Number(item.score || 0),
              0
            ) / questions.length
          : 0;

      const overallScore = Number(
        report?.overallScore || calculatedAverage
      );

      const response = await fetch(
        `${API_BASE_URL}/api/interviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: "AI HR Chat",
            difficulty: "Medium",
            questions,
            overallScore: Number(
              overallScore.toFixed(1)
            ),
            status: "Completed",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "The interview finished, but saving it failed."
        );
      }

      setSavedInterviewId(
        data.interview?._id || data.data?._id || ""
      );
    } catch (err) {
      setError(
        `${err.message} Your report is still visible on this page.`
      );
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !submitting
    ) {
      event.preventDefault();
      submitAnswer();
    }
  }

  function restartInterview() {
    hasStartedRef.current = false;
    setMessages([]);
    setEvaluations([]);
    setCurrentQuestion("");
    setQuestionNumber(0);
    setAnswer("");
    setIsComplete(false);
    setFinalReport(null);
    setSavedInterviewId("");
    setError("");

    hasStartedRef.current = true;
    startInterview();
  }

  const progressPercentage = useMemo(() => {
    if (isComplete) {
      return 100;
    }

    return Math.min(
      Math.max((questionNumber / TOTAL_QUESTIONS) * 100, 0),
      100
    );
  }, [questionNumber, isComplete]);

  if (starting) {
    return (
      <div className="hr-chat-page">
        <div className="hr-chat-loading-card">
          <div className="hr-chat-spinner"></div>
          <h2>Starting your AI HR interview...</h2>
          <p>
            The interviewer is preparing your first question.
          </p>
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="hr-chat-page">
        <div className="hr-chat-error-card">
          <span>⚠️</span>
          <h2>Unable to start interview</h2>
          <p>{error}</p>

          <div className="hr-chat-error-actions">
            <button
              type="button"
              onClick={startInterview}
            >
              Try Again
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-chat-page">
      <div className="hr-chat-container">
        <header className="hr-chat-header">
          <div>
            <p className="hr-chat-label">
              Conversational interview
            </p>

            <h1>AI HR Chat Interview</h1>

            <p>
              Answer naturally. The AI will evaluate each
              response and ask a relevant follow-up question.
            </p>
          </div>

          <button
            type="button"
            className="hr-chat-dashboard-button"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </header>

        <section className="hr-chat-progress-card">
          <div className="hr-chat-progress-info">
            <div>
              <span>Candidate</span>
              <strong>{candidateName}</strong>
            </div>

            <div>
              <span>Progress</span>
              <strong>
                {isComplete
                  ? "Completed"
                  : `Question ${questionNumber} of ${TOTAL_QUESTIONS}`}
              </strong>
            </div>
          </div>

          <div className="hr-chat-progress-track">
            <div
              className="hr-chat-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            ></div>
          </div>
        </section>

        {error && (
          <div className="hr-chat-inline-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <section className="hr-chat-panel">
          <div className="hr-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`hr-chat-message-row ${
                  message.sender === "user"
                    ? "user-row"
                    : "ai-row"
                }`}
              >
                <div
                  className={`hr-chat-avatar ${
                    message.sender === "user"
                      ? "user-avatar"
                      : "ai-avatar"
                  }`}
                >
                  {message.sender === "user"
                    ? "You"
                    : "AI"}
                </div>

                <div
                  className={`hr-chat-bubble ${
                    message.sender === "user"
                      ? "user-bubble"
                      : "ai-bubble"
                  } ${
                    message.type === "feedback"
                      ? "feedback-bubble"
                      : ""
                  }`}
                >
                  {message.type === "question" && (
                    <span className="hr-chat-question-number">
                      Question {message.questionNumber}
                    </span>
                  )}

                  {message.type === "feedback" && (
                    <span className="hr-chat-feedback-label">
                      Answer feedback
                    </span>
                  )}

                  <p>{message.text}</p>

                  {message.type === "feedback" && (
                    <span className="hr-chat-mini-score">
                      {Number(message.score || 0).toFixed(1)}
                      /10 · {getScoreLabel(message.score)}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {submitting && (
              <div className="hr-chat-message-row ai-row">
                <div className="hr-chat-avatar ai-avatar">
                  AI
                </div>

                <div className="hr-chat-bubble ai-bubble hr-chat-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {!isComplete && (
            <form
              className="hr-chat-input-area"
              onSubmit={submitAnswer}
            >
              <textarea
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here. Press Enter to send or Shift + Enter for a new line."
                disabled={submitting}
                maxLength={3000}
              />

              <div className="hr-chat-input-footer">
                <span>{answer.length}/3000 characters</span>

                <button
                  type="submit"
                  disabled={
                    submitting || answer.trim().length < 10
                  }
                >
                  {submitting
                    ? "AI is reviewing..."
                    : "Send Answer"}
                </button>
              </div>
            </form>
          )}
        </section>

        {isComplete && finalReport && (
          <section className="hr-chat-report" id="hr-chat-report">
            <div className="hr-chat-report-heading">
              <div>
                <p className="hr-chat-label">
                  Final evaluation
                </p>
                <h2>Your HR Interview Report</h2>
              </div>

              <div className="hr-chat-overall-score">
                <span>Overall</span>
                <strong>
                  {Number(
                    finalReport.overallScore || 0
                  ).toFixed(1)}
                  /10
                </strong>
              </div>
            </div>

            <div className="hr-chat-score-grid">
              <ScoreCard
                title="Communication"
                score={finalReport.communicationScore}
              />

              <ScoreCard
                title="Confidence"
                score={finalReport.confidenceScore}
              />

              <ScoreCard
                title="Professionalism"
                score={finalReport.professionalismScore}
              />

              <ScoreCard
                title="Answer Quality"
                score={finalReport.answerQualityScore}
              />
            </div>

            <div className="hr-chat-report-grid">
              <article className="hr-chat-report-card">
                <h3>Strengths</h3>
                <ReportList
                  items={finalReport.strengths}
                  emptyText="No strengths were returned."
                />
              </article>

              <article className="hr-chat-report-card">
                <h3>Areas to Improve</h3>
                <ReportList
                  items={finalReport.improvements}
                  emptyText="No improvement areas were returned."
                />
              </article>
            </div>

            <article className="hr-chat-final-feedback">
              <h3>Final Feedback</h3>
              <p>
                {finalReport.finalFeedback ||
                  "Continue practising structured and confident answers."}
              </p>

              <div className="hr-chat-recommendation">
                <span>Hiring recommendation</span>
                <strong>
                  {finalReport.hiringRecommendation ||
                    "Consider"}
                </strong>
              </div>
            </article>

            <div className="hr-chat-save-status">
              {saving && (
                <p>Saving your interview to history...</p>
              )}

              {!saving && savedInterviewId && (
                <p className="success">
                  Interview saved successfully.
                </p>
              )}
            </div>

            <div className="hr-chat-report-actions">
              <button
                type="button"
                onClick={() => navigate("/history")}
              >
                View Interview History
              </button>

              <button
                type="button"
                className="secondary"
                onClick={restartInterview}
              >
                Start Another Interview
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ title, score }) {
  const numericScore = Number(score || 0);

  return (
    <article className="hr-chat-score-card">
      <p>{title}</p>
      <h3>{numericScore.toFixed(1)}/10</h3>

      <div className="hr-chat-score-track">
        <div
          className="hr-chat-score-fill"
          style={{
            width: `${Math.min(
              Math.max(numericScore * 10, 0),
              100
            )}%`,
          }}
        ></div>
      </div>
    </article>
  );
}

function ReportList({ items, emptyText }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="hr-chat-empty-text">{emptyText}</p>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default HRChatInterview;