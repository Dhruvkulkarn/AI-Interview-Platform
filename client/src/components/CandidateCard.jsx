import "./CandidateCard.css";
function CandidateCard({ name, course, goal }) {
  return (
    <div className="card">
      <h2>👤 Candidate Card</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Course:</strong> {course}</p>
      <p><strong>Goal:</strong> {goal}</p>
    </div>
  );
}

export default CandidateCard;