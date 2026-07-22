import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/Interview.css";

function Interview() {
  const { role } = useParams();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState([]);

  useEffect(() => {
    async function getQuestions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://https://ai-interview-platform-5e0s.onrender.com/api/questions/${role}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load interview questions."
          );
        }

        if (!data.questions || data.questions.length === 0) {
          throw new Error("No interview questions were returned.");
        }

        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(""));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getQuestions();
  }, [role]);

  function handleAnswerChange(event) {
    const updatedAnswers = [...answers];

    updatedAnswers[currentQuestion] = event.target.value;

    setAnswers(updatedAnswers);
  }

  function goToNextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  async function submitInterview() {
    const hasEmptyAnswer = answers.some(
      (answer) => answer.trim() === ""
    );

    if (hasEmptyAnswer) {
      alert("Please answer every question before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setEvaluations([]);

      const results = [];

      for (let index = 0; index < questions.length; index++) {
        const response = await fetch(
          "http://https://ai-interview-platform-5e0s.onrender.com/api/evaluate-answer",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role,
              question: questions[index],
              answer: answers[index],
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "The AI evaluation failed."
          );
        }

        results.push({
          question: questions[index],
          answer: answers[index],
          score: Number(data.evaluation.score),
          strengths: data.evaluation.strengths,
          improvements: data.evaluation.improvements,
          idealAnswer: data.evaluation.idealAnswer,
        });
      }

      setEvaluations(results);

// Calculate average score
const calculatedAverageScore =
  results.reduce((total, item) => total + item.score, 0) /
  results.length;

// Convert evaluation results into the MongoDB question format
const interviewQuestions = results.map((item) => ({
  question: item.question,
  answer: item.answer,
  feedback: `
Strengths: ${item.strengths}

Areas to improve: ${item.improvements}

Ideal answer: ${item.idealAnswer}
  `.trim(),
  score: item.score,
}));

const token = localStorage.getItem("token");

if (!token) {
  throw new Error(
    "Your login session was not found. Please log in again."
  );
}

// Save the completed interview to MongoDB
const saveResponse = await fetch(
  "http://https://ai-interview-platform-5e0s.onrender.com/api/interviews",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      role,
      difficulty: "Medium",
      questions: interviewQuestions,
      overallScore: Number(
        calculatedAverageScore.toFixed(1)
      ),
      status: "Completed",
    }),
  }
);

const saveData = await saveResponse.json();

if (!saveResponse.ok) {
  throw new Error(
    saveData.message || "Failed to save interview history."
  );
}

console.log("Interview saved:", saveData.interview);

      setTimeout(() => {
        document
          .getElementById("interview-results")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="interview-page">
        <h2 className="loading-message">
          Loading interview questions...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interview-page">
        <div className="error-message">
          <h2>Unable to load interview</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="interview-page">
        <h2 className="loading-message">
          No interview questions available.
        </h2>
      </div>
    );
  }

  const progressPercentage =
    ((currentQuestion + 1) / questions.length) * 100;

  const totalScore = evaluations.reduce(
    (total, evaluation) => total + evaluation.score,
    0
  );

  const averageScore =
    evaluations.length > 0
      ? (totalScore / evaluations.length).toFixed(1)
      : 0;

  return (
    <div className="interview-page">
      <div className="interview-container">
        <div className="interview-header">
          <h1>{role.toUpperCase()} Interview</h1>

          <p>
            Answer every question and receive AI-generated
            feedback.
          </p>
        </div>

        <div className="question-card">
          <div className="question-information">
            <span>
              Question {currentQuestion + 1} of{" "}
              {questions.length}
            </span>

            <span className="role-badge">{role}</span>
          </div>

          <div className="progress-container">
            <div
              className="progress-bar"
              style={{
                width: `${progressPercentage}%`,
              }}
            ></div>
          </div>

          <h2 className="question-title">
            {questions[currentQuestion]}
          </h2>

          <textarea
            className="answer-box"
            placeholder="Type your answer here..."
            value={answers[currentQuestion] || ""}
            onChange={handleAnswerChange}
            disabled={submitting}
          />

          <div className="character-count">
            {(answers[currentQuestion] || "").length} characters
          </div>

          <div className="interview-buttons">
            <button
              className="interview-button previous-button"
              onClick={goToPreviousQuestion}
              disabled={currentQuestion === 0 || submitting}
            >
              Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                className="interview-button next-button"
                onClick={goToNextQuestion}
                disabled={submitting}
              >
                Next
              </button>
            ) : (
              <button
                className="interview-button submit-button"
                onClick={submitInterview}
                disabled={submitting}
              >
                {submitting
                  ? "Evaluating..."
                  : "Submit Interview"}
              </button>
            )}
          </div>
        </div>

        {submitting && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>

            <h3>Evaluating your answers...</h3>

            <p>
              Gemini AI is reviewing your interview. Please
              wait.
            </p>
          </div>
        )}

        {evaluations.length > 0 && (
          <div
            className="results-section"
            id="interview-results"
          >
            <h2 className="results-heading">
              Interview Results
            </h2>

            <div className="overall-score-card">
              <h2>Overall Score</h2>

              <div className="overall-score">
                {averageScore}/10
              </div>

              <p>
                Based on {evaluations.length} evaluated answers
              </p>
            </div>

            {evaluations.map((evaluation, index) => (
              <div className="result-card" key={index}>
                <h3>
                  Question {index + 1}:{" "}
                  {evaluation.question}
                </h3>

                <div className="score-badge">
                  Score: {evaluation.score}/10
                </div>

                <div className="result-item">
                  <strong>Your answer</strong>
                  <p>{evaluation.answer}</p>
                </div>

                <div className="result-item">
                  <strong>Strengths</strong>
                  <p>{evaluation.strengths}</p>
                </div>

                <div className="result-item">
                  <strong>Areas to improve</strong>
                  <p>{evaluation.improvements}</p>
                </div>

                <div className="result-item">
                  <strong>Ideal answer</strong>
                  <p>{evaluation.idealAnswer}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;