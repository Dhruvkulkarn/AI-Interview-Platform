const {
  startResumeInterview,
  respondToResumeInterview,
} = require("../services/resumeInterviewService");

async function startInterview(req, res) {
  try {
    const result = await startResumeInterview({
      userId: req.user.id,
      resumeId: req.body.resumeId,
      targetRole: req.body.targetRole,
      difficulty: req.body.difficulty,
      candidateName: req.body.candidateName,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Resume interview start error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Unable to start the resume interview.",
    });
  }
}

async function submitAnswer(req, res) {
  try {
    const result = await respondToResumeInterview({
      userId: req.user.id,
      interviewId: req.params.interviewId,
      answer: req.body.answer,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Resume interview answer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Unable to continue the resume interview.",
    });
  }
}

module.exports = {
  startInterview,
  submitAnswer,
};