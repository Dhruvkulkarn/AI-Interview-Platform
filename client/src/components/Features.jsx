import "../styles/Features.css";

function Features() {
  const features = [
    {
      icon: "🤖",
      title: "AI Mock Interviews",
      description:
        "Practice technical and HR interviews powered by AI with realistic questions.",
    },
    {
      icon: "⚡",
      title: "Instant Feedback",
      description:
        "Receive detailed AI feedback, scores, strengths and areas for improvement immediately.",
    },
    {
      icon: "📊",
      title: "Performance Analytics",
      description:
        "Track your interview history, monitor progress and identify your strongest skills.",
    },
  ];

  return (
    <section className="features">
      <div className="features-header">
        <span className="features-badge">Why Choose Us</span>

        <h2>Everything You Need to Crack Interviews</h2>

        <p>
          Prepare smarter with AI-powered interview practice,
          personalized feedback and detailed analytics.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <article className="feature-card" key={index}>
            <div className="feature-icon">
              {feature.icon}
            </div>

            <h3>{feature.title}</h3>

            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Features;