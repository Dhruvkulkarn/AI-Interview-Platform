import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState({
    totalInterviews: 0,
    averageScore: 0,
    highestScore: 0,
    latestScore: 0,
    rolePerformance: [],
  });

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username =
    localStorage.getItem("username") || "Candidate";

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const [analyticsResponse, interviewsResponse] =
          await Promise.all([
            fetch(
              "http://https://ai-interview-platform-5e0s.onrender.com/api/interviews/analytics",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            ),

            fetch("http://https://ai-interview-platform-5e0s.onrender.com/api/interviews", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        if (
          analyticsResponse.status === 401 ||
          interviewsResponse.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("username");

          navigate("/login");
          return;
        }

        const analyticsData = await analyticsResponse.json();
        const interviewsData = await interviewsResponse.json();

        if (!analyticsResponse.ok) {
          throw new Error(
            analyticsData.message ||
              "Unable to load dashboard statistics."
          );
        }

        if (!interviewsResponse.ok) {
          throw new Error(
            interviewsData.message ||
              "Unable to load recent interviews."
          );
        }

        setAnalytics(
          analyticsData.analytics || {
            totalInterviews: 0,
            averageScore: 0,
            highestScore: 0,
            latestScore: 0,
            rolePerformance: [],
          }
        );

        const interviews =
          interviewsData.interviews ||
          interviewsData.data ||
          interviewsData ||
          [];

        setRecentInterviews(
          Array.isArray(interviews)
            ? interviews.slice(0, 3)
            : []
        );
      } catch (error) {
        setError(
          error.message ||
            "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  const getRoleIcon = (role, interviewType) => {
    const normalizedRole = role?.toLowerCase();
    const normalizedType = interviewType?.toLowerCase();

    if (normalizedType === "resume based") {
      return "📄";
    }

    if (normalizedRole === "react") {
      return "⚛️";
    }

    if (normalizedRole === "java") {
      return "☕";
    }

    if (
      normalizedRole === "ai hr chat" ||
      normalizedRole === "hr chat"
    ) {
      return "🤖";
    }

    return "💼";
  };

  const formatRole = (role) => {
    if (!role) {
      return "Interview";
    }

    return role
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  const formatInterviewTitle = (interview) => {
    if (interview.interviewType === "Resume Based") {
      return `${formatRole(interview.role)} Resume Interview`;
    }

    return `${formatRole(interview.role)} Interview`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const averageScore = Number(
    analytics.averageScore || 0
  ).toFixed(1);

  const bestScore = Number(
    analytics.highestScore || 0
  ).toFixed(1);

  const latestScore = Number(
    analytics.latestScore || 0
  ).toFixed(1);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-hero">
          <div>
            <p className="dashboard-label">
              AI Interview Preparation Platform
            </p>

            <h1>Welcome back, {username} 👋</h1>

            <p className="dashboard-description">
              Practice interviews, receive AI feedback and track
              your progress in one place.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <Link className="history-link" to="/history">
              Interview History
            </Link>

            <Link
              className="history-link"
              to="/resume-analyzer"
            >
              Resume Analyzer
            </Link>

            <Link
              className="history-link"
              to="/resume-history"
            >
              Resume History
            </Link>
          </div>
        </section>

        {loading && (
          <div className="empty-history">
            <span>⏳</span>
            <h3>Loading dashboard...</h3>
          </div>
        )}

        {error && !loading && (
          <div className="empty-history">
            <span>⚠️</span>
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="statistics-grid">
              <div className="stat-card">
                <span className="stat-icon">🎯</span>

                <div>
                  <p>Total Interviews</p>
                  <h2>{analytics.totalInterviews || 0}</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">📊</span>

                <div>
                  <p>Average Score</p>
                  <h2>{averageScore}/10</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">🏆</span>

                <div>
                  <p>Best Score</p>
                  <h2>{bestScore}/10</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">📈</span>

                <div>
                  <p>Latest Score</p>
                  <h2>{latestScore}/10</h2>
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    Interview categories
                  </p>

                  <h2>Choose your interview</h2>
                </div>

                <p>
                  Select a category and begin your mock
                  interview.
                </p>
              </div>

              <div className="interview-grid">
                <article className="interview-card react-card">
                  <div className="interview-card-top">
                    <span className="interview-icon">⚛️</span>

                    <span className="difficulty-badge">
                      Frontend
                    </span>
                  </div>

                  <h3>React Developer</h3>

                  <p>
                    Practice components, props, state, hooks and
                    frontend concepts.
                  </p>

                  <ul>
                    <li>5 interview questions</li>
                    <li>AI-generated feedback</li>
                    <li>Score and ideal answers</li>
                  </ul>

                  <Link
                    className="start-interview-button"
                    to="/interview/react"
                  >
                    Start React Interview
                  </Link>
                </article>

                <article className="interview-card java-card">
                  <div className="interview-card-top">
                    <span className="interview-icon">☕</span>

                    <span className="difficulty-badge">
                      Programming
                    </span>
                  </div>

                  <h3>Java Developer</h3>

                  <p>
                    Practice Java fundamentals and
                    object-oriented programming questions.
                  </p>

                  <ul>
                    <li>5 interview questions</li>
                    <li>AI-generated feedback</li>
                    <li>Score and ideal answers</li>
                  </ul>

                  <Link
                    className="start-interview-button"
                    to="/interview/java"
                  >
                    Start Java Interview
                  </Link>
                </article>

                <article className="interview-card ai-hr-card">
                  <div className="interview-card-top">
                    <span className="interview-icon">💼</span>

                    <span className="difficulty-badge">
                      Behavioural
                    </span>
                  </div>

                  <h3>HR Interview</h3>

                  <p>
                    Practice common behavioural, communication
                    and career questions.
                  </p>

                  <ul>
                    <li>5 fixed interview questions</li>
                    <li>AI-generated feedback</li>
                    <li>Score and ideal answers</li>
                  </ul>

                  <Link
                    className="start-interview-button"
                    to="/interview/hr"
                  >
                    Start HR Interview
                  </Link>
                </article>

                <article className="interview-card hr-card">
                  <div className="interview-card-top">
                    <span className="interview-icon">🤖</span>

                    <span className="difficulty-badge">
                      Conversational
                    </span>
                  </div>

                  <h3>AI HR Chat Interview</h3>

                  <p>
                    Take a realistic conversational HR interview
                    with intelligent follow-up questions.
                  </p>

                  <ul>
                    <li>5 dynamic HR questions</li>
                    <li>Follow-up questions based on answers</li>
                    <li>Detailed hiring recommendation</li>
                  </ul>

                  <Link
                    className="start-interview-button"
                    to="/hr-chat-interview"
                  >
                    Start AI HR Chat
                  </Link>
                </article>

                <article className="interview-card resume-card">
                  <div className="interview-card-top">
                    <span className="interview-icon">📄</span>

                    <span className="difficulty-badge">
                      Resume AI
                    </span>
                  </div>

                  <h3>Resume-Based Interview</h3>

                  <p>
                    Take a personalized AI interview using your
                    resume, skills, projects, education and
                    experience.
                  </p>

                  <ul>
                    <li>5 AI-generated resume questions</li>
                    <li>Questions based on projects and skills</li>
                    <li>Detailed final interview report</li>
                  </ul>

                  <Link
                    className="start-interview-button"
                    to="/resume-interview-selection"
                  >
                    Start Resume Interview
                  </Link>
                </article>

                <article className="interview-card history-card">
                  <div className="interview-card-top">
                    <span className="interview-icon">📚</span>

                    <span className="difficulty-badge">
                      Reports
                    </span>
                  </div>

                  <h3>Resume History</h3>

                  <p>
                    View all your previous AI resume analyses,
                    ATS scores, strengths, weaknesses and
                    detailed reports anytime.
                  </p>

                  <ul>
                    <li>Saved reports</li>
                    <li>ATS history</li>
                    <li>Detailed resume analysis</li>
                  </ul>

                  <Link
                    className="start-interview-button"
                    to="/resume-history"
                  >
                    View Resume History
                  </Link>
                </article>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading recent-heading">
                <div>
                  <p className="section-label">
                    Recent activity
                  </p>

                  <h2>Recent interviews</h2>
                </div>

                <Link className="text-link" to="/history">
                  View all
                </Link>
              </div>

              {recentInterviews.length === 0 ? (
                <div className="empty-history">
                  <span>📝</span>

                  <h3>No interviews completed yet</h3>

                  <p>
                    Complete your first interview and your
                    results will appear here.
                  </p>
                </div>
              ) : (
                <div className="recent-list">
                  {recentInterviews.map((interview) => (
                    <div
                      className="recent-item"
                      key={interview._id}
                    >
                      <div className="recent-role">
                        <div className="recent-role-icon">
                          {getRoleIcon(
                            interview.role,
                            interview.interviewType
                          )}
                        </div>

                        <div>
                          <h3>
                            {formatInterviewTitle(interview)}
                          </h3>

                          <p>
                            {formatDate(interview.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="recent-score">
                        {Number(
                          interview.overallScore || 0
                        ).toFixed(1)}
                        /10
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;