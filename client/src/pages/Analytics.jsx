import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../styles/Analytics.css";

function Analytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState({
    totalInterviews: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    latestScore: 0,
    rolePerformance: [],
    scoreProgress: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/interviews/analytics",
          {
            method: "GET",
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
            data.message || "Failed to load analytics."
          );
        }

        setAnalytics(data.analytics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [navigate]);

  const {
    totalInterviews,
    averageScore,
    highestScore,
    rolePerformance,
    scoreProgress,
  } = analytics;

  function getRoleAverage(roleName) {
    const roleData = rolePerformance.find(
      (item) =>
        item.role.toLowerCase() === roleName.toLowerCase()
    );

    return roleData ? Number(roleData.averageScore) : 0;
  }

  const reactAverage = getRoleAverage("react");
  const javaAverage = getRoleAverage("java");
  const hrAverage = getRoleAverage("hr");

  const roleChartData = rolePerformance.map((item) => ({
    role: item.role.toUpperCase(),
    score: Number(item.averageScore),
  }));

  const progressChartData = scoreProgress.map((item) => ({
    interview: `#${item.interviewNumber}`,
    score: Number(item.score),
    role: item.role.toUpperCase(),
  }));

  const bestRole =
    rolePerformance.length > 0
      ? rolePerformance.reduce((best, current) =>
          Number(current.averageScore) >
          Number(best.averageScore)
            ? current
            : best
        )
      : null;

  function getPerformanceLevel(score) {
    const numericScore = Number(score);

    if (numericScore >= 8) {
      return {
        title: "Excellent",
        message:
          "Your interview performance is strong. Continue practising to maintain consistency.",
        className: "performance-excellent",
      };
    }

    if (numericScore >= 6) {
      return {
        title: "Good Progress",
        message:
          "You are performing well, but there is still room to strengthen your answers.",
        className: "performance-good",
      };
    }

    if (numericScore > 0) {
      return {
        title: "Needs Improvement",
        message:
          "Focus on clearer explanations, stronger examples and regular practice.",
        className: "performance-low",
      };
    }

    return {
      title: "No Data Yet",
      message:
        "Complete your first interview to generate performance insights.",
      className: "performance-empty",
    };
  }

  const performance = getPerformanceLevel(averageScore);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <section className="analytics-empty-state">
            <span>⏳</span>
            <h2>Loading analytics...</h2>
            <p>Please wait while your performance is calculated.</p>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <section className="analytics-empty-state">
            <span>⚠️</span>
            <h2>Unable to load analytics</h2>
            <p>{error}</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <section className="analytics-header">
          <div>
            <p className="analytics-label">
              Performance analytics
            </p>

            <h1>Your Interview Progress</h1>

            <p className="analytics-description">
              Understand your performance across interviews and
              identify areas that need improvement.
            </p>
          </div>

          <div className="analytics-header-icon">📈</div>
        </section>

        <section className="analytics-statistics">
          <article className="analytics-stat-card">
            <span>📝</span>

            <div>
              <p>Total Interviews</p>
              <h2>{totalInterviews}</h2>
            </div>
          </article>

          <article className="analytics-stat-card">
            <span>📊</span>

            <div>
              <p>Average Score</p>
              <h2>{Number(averageScore).toFixed(1)}/10</h2>
            </div>
          </article>

          <article className="analytics-stat-card">
            <span>🏆</span>

            <div>
              <p>Best Score</p>
              <h2>{Number(highestScore).toFixed(1)}/10</h2>
            </div>
          </article>

          <article className="analytics-stat-card">
            <span>⭐</span>

            <div>
              <p>Best Role</p>

              <h2>
                {bestRole
                  ? bestRole.role.toUpperCase()
                  : "N/A"}
              </h2>
            </div>
          </article>
        </section>

        {totalInterviews === 0 ? (
          <section className="analytics-empty-state">
            <span>📭</span>

            <h2>No analytics available yet</h2>

            <p>
              Complete at least one interview to generate charts
              and performance insights.
            </p>
          </section>
        ) : (
          <>
            <section className="analytics-chart-grid">
              <article className="analytics-chart-card">
                <div className="chart-heading">
                  <div>
                    <p>Progress</p>
                    <h2>Score Over Time</h2>
                  </div>

                  <span>
                    Last {totalInterviews} interviews
                  </span>
                </div>

                <div className="chart-container">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={progressChartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis dataKey="interview" />

                      <YAxis domain={[0, 10]} />

                      <Tooltip
                        formatter={(value) => [
                          `${value}/10`,
                          "Score",
                        ]}
                        labelFormatter={(label, payload) => {
                          const role =
                            payload?.[0]?.payload?.role;

                          return role
                            ? `${label} - ${role}`
                            : label;
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="analytics-chart-card">
                <div className="chart-heading">
                  <div>
                    <p>Comparison</p>
                    <h2>Average Score by Role</h2>
                  </div>

                  <span>Maximum score: 10</span>
                </div>

                <div className="chart-container">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={roleChartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis dataKey="role" />

                      <YAxis domain={[0, 10]} />

                      <Tooltip
                        formatter={(value) => [
                          `${value}/10`,
                          "Average score",
                        ]}
                      />

                      <Bar
                        dataKey="score"
                        fill="#4f46e5"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="role-performance-section">
              <div className="analytics-section-heading">
                <div>
                  <p>Role breakdown</p>
                  <h2>Category Performance</h2>
                </div>
              </div>

              <div className="role-performance-grid">
                <article className="role-performance-card">
                  <div className="role-performance-title">
                    <span>⚛️</span>
                    <h3>React Developer</h3>
                  </div>

                  <strong>{reactAverage}/10</strong>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${reactAverage * 10}%`,
                      }}
                    />
                  </div>
                </article>

                <article className="role-performance-card">
                  <div className="role-performance-title">
                    <span>☕</span>
                    <h3>Java Developer</h3>
                  </div>

                  <strong>{javaAverage}/10</strong>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${javaAverage * 10}%`,
                      }}
                    />
                  </div>
                </article>

                <article className="role-performance-card">
                  <div className="role-performance-title">
                    <span>💼</span>
                    <h3>HR Interview</h3>
                  </div>

                  <strong>{hrAverage}/10</strong>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${hrAverage * 10}%`,
                      }}
                    />
                  </div>
                </article>
              </div>
            </section>

            <section
              className={`performance-insight ${performance.className}`}
            >
              <div className="performance-insight-icon">
                💡
              </div>

              <div>
                <p>Overall performance</p>
                <h2>{performance.title}</h2>
                <span>{performance.message}</span>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;