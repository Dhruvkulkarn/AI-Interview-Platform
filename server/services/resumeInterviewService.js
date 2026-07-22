const Interview = require("../models/Interview");
const ResumeAnalysis = require("../models/ResumeAnalysis");

const {
  generateFirstQuestion,
  evaluateAnswer,
  generateFinalReport,
} = require("../utils/geminiResumeInterview");

const TOTAL_QUESTIONS = 5;

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeDifficulty(value) {
  const difficulty = cleanText(value);
  const allowedDifficulties = ["Easy", "Medium", "Hard"];

  return allowedDifficulties.includes(difficulty)
    ? difficulty
    : "Medium";
}

function normalizeScore(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Number(
    Math.min(Math.max(numericValue, 0), 10).toFixed(1)
  );
}

function formatStringArray(values, emptyMessage) {
  if (!Array.isArray(values) || values.length === 0) {
    return emptyMessage;
  }

  const cleanedValues = values
    .map((value) => cleanText(value))
    .filter(Boolean);

  return cleanedValues.length > 0
    ? cleanedValues.join(", ")
    : emptyMessage;
}

function formatProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return "No projects were extracted from the resume.";
  }

  return projects
    .map((project, index) => {
      const projectName =
        cleanText(project.name) || "Unnamed project";

      const description =
        cleanText(project.description) ||
        "No description provided.";

      const technologies = formatStringArray(
        project.technologies,
        "No technologies provided."
      );

      return [
        `${index + 1}. Project: ${projectName}`,
        `Description: ${description}`,
        `Technologies: ${technologies}`,
      ].join("\n");
    })
    .join("\n\n");
}

function formatEducation(education) {
  if (
    !Array.isArray(education) ||
    education.length === 0
  ) {
    return "No education details were extracted from the resume.";
  }

  return education
    .map((item, index) => {
      const qualification =
        cleanText(item.qualification) ||
        "Qualification not provided";

      const institution =
        cleanText(item.institution) ||
        "Institution not provided";

      const year =
        cleanText(item.year) || "Year not provided";

      return `${index + 1}. ${qualification} - ${institution} (${year})`;
    })
    .join("\n");
}

function formatExperience(experience) {
  if (
    !Array.isArray(experience) ||
    experience.length === 0
  ) {
    return "No work experience was extracted from the resume.";
  }

  return experience
    .map((item, index) => {
      const role =
        cleanText(item.role) || "Role not provided";

      const organization =
        cleanText(item.organization) ||
        "Organization not provided";

      const duration =
        cleanText(item.duration) ||
        "Duration not provided";

      const description =
        cleanText(item.description) ||
        "Description not provided";

      return [
        `${index + 1}. Role: ${role}`,
        `Organization: ${organization}`,
        `Duration: ${duration}`,
        `Description: ${description}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildResumeContext(resume) {
  return `
RESUME FILE
${cleanText(resume.fileName)}

PROFESSIONAL SUMMARY
${
  cleanText(resume.professionalSummary) ||
  "No professional summary was extracted."
}

SKILLS
${formatStringArray(
  resume.skills,
  "No skills were extracted."
)}

TECHNOLOGIES
${formatStringArray(
  resume.technologies,
  "No technologies were extracted."
)}

PROJECTS
${formatProjects(resume.projects)}

EDUCATION
${formatEducation(resume.education)}

EXPERIENCE
${formatExperience(resume.experience)}

CERTIFICATIONS
${formatStringArray(
  resume.certifications,
  "No certifications were extracted."
)}

BEST-SUITED JOB ROLES
${formatStringArray(
  resume.bestJobRoles,
  "No suitable roles were extracted."
)}

ORIGINAL RESUME TEXT
${cleanText(resume.resumeText).slice(0, 18000)}
`.trim();
}

function formatInterviewConversation(questions) {
  if (
    !Array.isArray(questions) ||
    questions.length === 0
  ) {
    return "No interview conversation is available.";
  }

  const answeredQuestions = questions.filter(
    (item) => cleanText(item.answer)
  );

  if (answeredQuestions.length === 0) {
    return "No questions have been answered yet.";
  }

  return answeredQuestions
    .map((item, index) => {
      return [
        `Question ${index + 1}:`,
        cleanText(item.question),
        "",
        "Candidate answer:",
        cleanText(item.answer),
        "",
        `Score: ${normalizeScore(item.score)}/10`,
        `Technical score: ${normalizeScore(
          item.technicalScore
        )}/10`,
        `Communication score: ${normalizeScore(
          item.communicationScore
        )}/10`,
        `Confidence score: ${normalizeScore(
          item.confidenceScore
        )}/10`,
        `Answer quality score: ${normalizeScore(
          item.answerQualityScore
        )}/10`,
        `Strengths: ${cleanText(item.strengths)}`,
        `Improvements: ${cleanText(
          item.improvements
        )}`,
        `Feedback: ${cleanText(item.feedback)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function calculateAverage(questions, fieldName) {
  const answeredQuestions = questions.filter(
    (item) => cleanText(item.answer)
  );

  if (answeredQuestions.length === 0) {
    return 0;
  }

  const total = answeredQuestions.reduce(
    (sum, item) =>
      sum + normalizeScore(item[fieldName]),
    0
  );

  return normalizeScore(
    total / answeredQuestions.length
  );
}

function calculateInterviewScores(questions) {
  return {
    technicalScore: calculateAverage(
      questions,
      "technicalScore"
    ),

    communicationScore: calculateAverage(
      questions,
      "communicationScore"
    ),

    confidenceScore: calculateAverage(
      questions,
      "confidenceScore"
    ),

    answerQualityScore: calculateAverage(
      questions,
      "answerQualityScore"
    ),

    overallScore: calculateAverage(
      questions,
      "score"
    ),
  };
}

function ensureValidUserId(userId) {
  if (!userId) {
    const error = new Error(
      "Authentication is required."
    );

    error.statusCode = 401;
    throw error;
  }
}

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

async function findUserResume(userId, resumeId) {
  const resume = await ResumeAnalysis.findOne({
    _id: resumeId,
    user: userId,
  });

  if (!resume) {
    throw createServiceError(
      "Resume analysis not found.",
      404
    );
  }

  if (!cleanText(resume.resumeText)) {
    throw createServiceError(
      "This resume does not contain detailed extracted data. Please analyze the resume again before starting the interview.",
      400
    );
  }

  return resume;
}

async function findUserResumeInterview(
  userId,
  interviewId
) {
  const interview = await Interview.findOne({
    _id: interviewId,
    user: userId,
    interviewType: "Resume Based",
  });

  if (!interview) {
    throw createServiceError(
      "Resume-based interview not found.",
      404
    );
  }

  return interview;
}

async function startResumeInterview({
  userId,
  resumeId,
  targetRole,
  difficulty,
  candidateName,
}) {
  ensureValidUserId(userId);

  if (!resumeId) {
    throw createServiceError(
      "Please select a resume.",
      400
    );
  }

  const resume = await findUserResume(
    userId,
    resumeId
  );

  const selectedRole =
    cleanText(targetRole) ||
    cleanText(resume.bestJobRoles?.[0]) ||
    "Entry-Level Software Developer";

  const selectedDifficulty =
    normalizeDifficulty(difficulty);

  const resumeContext = buildResumeContext(resume);

  const generatedQuestion =
    await generateFirstQuestion({
      resumeContext,
      targetRole: selectedRole,
      difficulty: selectedDifficulty,
      candidateName:
        cleanText(candidateName) || "Candidate",
    });

  const interview = await Interview.create({
    user: userId,
    interviewType: "Resume Based",
    resumeAnalysis: resume._id,
    resumeFileName: resume.fileName,
    role: selectedRole,
    difficulty: selectedDifficulty,

    questions: [
      {
        question: generatedQuestion.question,
      },
    ],

    overallScore: 0,
    technicalScore: 0,
    communicationScore: 0,
    confidenceScore: 0,
    answerQualityScore: 0,
    resumeAuthenticityScore: 0,

    strengths: [],
    improvements: [],
    finalFeedback: "",
    hiringRecommendation: "",
    status: "In Progress",
  });

  return {
    message: "Resume-based interview started.",

    interview: {
      id: interview._id,
      interviewType: interview.interviewType,
      resumeId: resume._id,
      resumeFileName: resume.fileName,
      role: interview.role,
      difficulty: interview.difficulty,

      totalQuestions: TOTAL_QUESTIONS,
      currentQuestionNumber: 1,

      question: generatedQuestion.question,
      questionTopic: generatedQuestion.topic,
      questionReason: generatedQuestion.reason,

      status: interview.status,
      createdAt: interview.createdAt,
    },
  };
}

async function respondToResumeInterview({
  userId,
  interviewId,
  answer,
}) {
  ensureValidUserId(userId);

  const candidateAnswer = cleanText(answer);

  if (!interviewId) {
    throw createServiceError(
      "Interview ID is required.",
      400
    );
  }

  if (!candidateAnswer) {
    throw createServiceError(
      "Please enter your answer.",
      400
    );
  }

  if (candidateAnswer.length < 15) {
    throw createServiceError(
      "Please provide a more detailed answer before continuing.",
      400
    );
  }

  const interview =
    await findUserResumeInterview(
      userId,
      interviewId
    );

  if (interview.status === "Completed") {
    throw createServiceError(
      "This interview has already been completed.",
      400
    );
  }

  const resume = await findUserResume(
    userId,
    interview.resumeAnalysis
  );

  if (
    !Array.isArray(interview.questions) ||
    interview.questions.length === 0
  ) {
    throw createServiceError(
      "The interview does not contain a current question.",
      400
    );
  }

  const currentQuestionIndex =
    interview.questions.length - 1;

  const currentQuestion =
    interview.questions[currentQuestionIndex];

  if (!currentQuestion) {
    throw createServiceError(
      "The current interview question was not found.",
      400
    );
  }

  if (cleanText(currentQuestion.answer)) {
    throw createServiceError(
      "The current question has already been answered.",
      400
    );
  }

  const currentQuestionNumber =
    interview.questions.length;

  const resumeContext = buildResumeContext(resume);

  const previousConversation =
    formatInterviewConversation(
      interview.questions.slice(
        0,
        currentQuestionIndex
      )
    );

  const evaluationResult =
    await evaluateAnswer({
      resumeContext,
      targetRole: interview.role,
      difficulty: interview.difficulty,
      questionNumber: currentQuestionNumber,
      totalQuestions: TOTAL_QUESTIONS,
      currentQuestion: currentQuestion.question,
      candidateAnswer,
      previousConversation,
    });

  const evaluation =
    evaluationResult.evaluation;

  currentQuestion.answer = candidateAnswer;
  currentQuestion.score = evaluation.score;

  currentQuestion.technicalScore =
    evaluation.technicalScore;

  currentQuestion.communicationScore =
    evaluation.communicationScore;

  currentQuestion.confidenceScore =
    evaluation.confidenceScore;

  currentQuestion.answerQualityScore =
    evaluation.answerQualityScore;

  currentQuestion.strengths =
    evaluation.strengths;

  currentQuestion.improvements =
    evaluation.improvements;

  currentQuestion.feedback =
    evaluation.feedback;

  if (!evaluationResult.isComplete) {
    const nextQuestion =
      cleanText(evaluationResult.nextQuestion) ||
      "Choose another project or skill from your resume and explain how you applied it.";

    interview.questions.push({
      question: nextQuestion,
    });

    await interview.save();

    return {
      message:
        "Answer evaluated successfully.",

      evaluation: {
        question: currentQuestion.question,
        answer: currentQuestion.answer,
        score: currentQuestion.score,

        technicalScore:
          currentQuestion.technicalScore,

        communicationScore:
          currentQuestion.communicationScore,

        confidenceScore:
          currentQuestion.confidenceScore,

        answerQualityScore:
          currentQuestion.answerQualityScore,

        resumeAuthenticityScore:
          evaluation.resumeAuthenticityScore,

        strengths:
          currentQuestion.strengths,

        improvements:
          currentQuestion.improvements,

        feedback:
          currentQuestion.feedback,
      },

      isComplete: false,
      nextQuestion,

      currentQuestionNumber:
        currentQuestionNumber + 1,

      totalQuestions: TOTAL_QUESTIONS,
      finalReport: null,
    };
  }

  const calculatedScores =
    calculateInterviewScores(
      interview.questions
    );

  const interviewConversation =
    formatInterviewConversation(
      interview.questions
    );

  const finalReport =
    await generateFinalReport({
      resumeContext,
      targetRole: interview.role,
      difficulty: interview.difficulty,
      interviewConversation,
      calculatedScores,
    });

  interview.technicalScore =
    finalReport.technicalScore;

  interview.communicationScore =
    finalReport.communicationScore;

  interview.confidenceScore =
    finalReport.confidenceScore;

  interview.answerQualityScore =
    finalReport.answerQualityScore;

  interview.resumeAuthenticityScore =
    finalReport.resumeAuthenticityScore;

  interview.overallScore =
    finalReport.overallScore;

  interview.strengths =
    finalReport.strengths;

  interview.improvements =
    finalReport.improvements;

  interview.finalFeedback =
    finalReport.finalFeedback;

  interview.hiringRecommendation =
    finalReport.hiringRecommendation;

  interview.status = "Completed";

  await interview.save();

  return {
    message:
      "Resume-based interview completed successfully.",

    evaluation: {
      question: currentQuestion.question,
      answer: currentQuestion.answer,
      score: currentQuestion.score,

      technicalScore:
        currentQuestion.technicalScore,

      communicationScore:
        currentQuestion.communicationScore,

      confidenceScore:
        currentQuestion.confidenceScore,

      answerQualityScore:
        currentQuestion.answerQualityScore,

      resumeAuthenticityScore:
        evaluation.resumeAuthenticityScore,

      strengths:
        currentQuestion.strengths,

      improvements:
        currentQuestion.improvements,

      feedback:
        currentQuestion.feedback,
    },

    isComplete: true,
    nextQuestion: null,

    currentQuestionNumber,
    totalQuestions: TOTAL_QUESTIONS,

    finalReport: {
      interviewId: interview._id,
      interviewType:
        interview.interviewType,

      resumeId: resume._id,
      resumeFileName:
        interview.resumeFileName,

      role: interview.role,
      difficulty: interview.difficulty,

      technicalScore:
        interview.technicalScore,

      communicationScore:
        interview.communicationScore,

      confidenceScore:
        interview.confidenceScore,

      answerQualityScore:
        interview.answerQualityScore,

      resumeAuthenticityScore:
        interview.resumeAuthenticityScore,

      overallScore:
        interview.overallScore,

      strengths:
        interview.strengths,

      improvements:
        interview.improvements,

      finalFeedback:
        interview.finalFeedback,

      hiringRecommendation:
        interview.hiringRecommendation,

      status: interview.status,
      completedAt: interview.updatedAt,
    },
  };
}

module.exports = {
  startResumeInterview,
  respondToResumeInterview,
};