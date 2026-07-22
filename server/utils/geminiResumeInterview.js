const { GoogleGenAI } = require("@google/genai");

const DEFAULT_MODEL = "gemini-3.5-flash";

/**
 * Creates the Gemini client only when a request is made.
 * This ensures dotenv has already loaded GEMINI_API_KEY.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to your server .env file."
    );
  }

  return new GoogleGenAI({
    apiKey,
  });
}

/**
 * Allows the Gemini model to be changed from the .env file.
 *
 * Example:
 * GEMINI_MODEL=gemini-3.5-flash
 */
function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

function cleanText(value) {
  return String(value || "").trim();
}

function removeMarkdownCodeFences(value) {
  return cleanText(value)
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Safely parses Gemini JSON responses.
 */
function parseGeminiJson(responseText) {
  const cleanedResponse = removeMarkdownCodeFences(responseText);

  if (!cleanedResponse) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(cleanedResponse);
  } catch (firstError) {
    const firstObjectBrace = cleanedResponse.indexOf("{");
    const lastObjectBrace = cleanedResponse.lastIndexOf("}");

    if (
      firstObjectBrace !== -1 &&
      lastObjectBrace !== -1 &&
      lastObjectBrace > firstObjectBrace
    ) {
      const possibleObject = cleanedResponse.slice(
        firstObjectBrace,
        lastObjectBrace + 1
      );

      try {
        return JSON.parse(possibleObject);
      } catch (secondError) {
        console.error(
          "Gemini JSON parsing failed:",
          cleanedResponse
        );
      }
    }

    throw new Error(
      "Gemini returned an invalid response. Please try again."
    );
  }
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

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }

    return [];
  }

  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function normalizeRecommendation(value, overallScore = 0) {
  const allowedRecommendations = [
    "Highly Recommended",
    "Recommended",
    "Consider",
    "Needs Improvement",
  ];

  const recommendation = cleanText(value);

  if (allowedRecommendations.includes(recommendation)) {
    return recommendation;
  }

  if (overallScore >= 8.5) {
    return "Highly Recommended";
  }

  if (overallScore >= 7) {
    return "Recommended";
  }

  if (overallScore >= 5) {
    return "Consider";
  }

  return "Needs Improvement";
}

/**
 * Sends a prompt to Gemini and expects a JSON response.
 */
async function generateJsonResponse(prompt) {
  try {
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    if (!response || !response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    return parseGeminiJson(response.text);
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error.status === 429 || error.statusCode === 429) {
      const quotaError = new Error(
        "Gemini API quota has been exhausted. Please wait for the quota to reset and try again."
      );

      quotaError.statusCode = 429;
      throw quotaError;
    }

    const serviceError = new Error(
      error.message ||
        "The AI service is temporarily unavailable. Please try again."
    );

    serviceError.statusCode =
      error.statusCode || error.status || 500;

    throw serviceError;
  }
}

/**
 * Generates the first question of the resume-based interview.
 */
async function generateFirstQuestion({
  resumeContext,
  targetRole,
  difficulty,
  candidateName,
}) {
  if (!cleanText(resumeContext)) {
    throw new Error(
      "Resume context is required to generate an interview question."
    );
  }

  const prompt = `
You are a professional technical interviewer conducting a realistic
resume-based interview for an entry-level candidate.

Candidate name:
${cleanText(candidateName) || "Candidate"}

Target role:
${cleanText(targetRole) || "Entry-Level Software Developer"}

Interview difficulty:
${cleanText(difficulty) || "Medium"}

Candidate resume:
${resumeContext}

Generate the first interview question.

The question must be based strictly on information available in the
candidate's resume.

Prefer questions related to:

- A specific project
- A technical skill
- A technology or framework
- Internship or work experience
- Certification
- Education-related technical knowledge

Do not invent any details that are not present in the resume.

Return only valid JSON using exactly this structure:

{
  "question": "The interview question",
  "topic": "Project, Skill, Technology, Experience, Education or Certification",
  "reason": "A brief explanation of why this question was selected"
}

Rules:

- Ask only one question.
- Do not ask a generic HR question.
- Keep the question clear and professional.
- Keep it appropriate for an entry-level candidate.
- Match the requested difficulty.
- Do not include markdown.
- Do not include code fences.
- Return only valid JSON.
`;

  const result = await generateJsonResponse(prompt);

  return {
    question:
      cleanText(result.question) ||
      "Choose one project from your resume and explain how you built it.",
    topic: cleanText(result.topic) || "Resume",
    reason:
      cleanText(result.reason) ||
      "This question is based on information from the selected resume.",
  };
}

/**
 * Evaluates one answer and generates the next question.
 */
async function evaluateAnswer({
  resumeContext,
  targetRole,
  difficulty,
  questionNumber,
  totalQuestions,
  currentQuestion,
  candidateAnswer,
  previousConversation,
}) {
  if (!cleanText(currentQuestion)) {
    throw new Error("The current interview question is required.");
  }

  if (!cleanText(candidateAnswer)) {
    throw new Error("The candidate answer is required.");
  }

  const isFinalQuestion =
    Number(questionNumber) >= Number(totalQuestions);

  const prompt = `
You are a professional technical interviewer evaluating an entry-level
candidate in a resume-based interview.

Target role:
${cleanText(targetRole) || "Entry-Level Software Developer"}

Difficulty:
${cleanText(difficulty) || "Medium"}

Question:
${Number(questionNumber) || 1} of ${Number(totalQuestions) || 5}

Candidate resume:
${resumeContext}

Previous interview conversation:
${
  cleanText(previousConversation) ||
  "This is the first completed answer."
}

Current question:
${currentQuestion}

Candidate answer:
${candidateAnswer}

Evaluate the candidate's current answer.

Evaluate these areas:

1. Technical knowledge
2. Communication clarity
3. Confidence
4. Answer quality
5. Consistency with the resume

 ${
   isFinalQuestion
     ? "This is the final question. Do not generate another question."
     : `After evaluating the answer, generate one relevant next question.

The next question must:

- Be based on the candidate's resume
- Be related naturally to the interview conversation
- Not repeat an earlier question
- Be suitable for the selected difficulty`
 }

Return only valid JSON using exactly this structure:

{
  "evaluation": {
    "score": 7.5,
    "technicalScore": 7,
    "communicationScore": 8,
    "confidenceScore": 7,
    "answerQualityScore": 7.5,
    "resumeAuthenticityScore": 8,
    "strengths": "What the candidate did well",
    "improvements": "What the candidate should improve",
    "feedback": "Concise professional interviewer feedback"
  },
  "isComplete": ${isFinalQuestion},
  "nextQuestion": ${
    isFinalQuestion
      ? "null"
      : '"The next resume-based interview question"'
  }
}

Rules:

- Every score must be between 0 and 10.
- Evaluate fairly for an entry-level candidate.
- Do not punish the candidate for being a fresher.
- Do not assume dishonesty only because an answer is short.
- Resume authenticity should measure consistency with the resume.
- Feedback must be constructive and concise.
- Do not include markdown.
- Do not include code fences.
- Return only valid JSON.
`;

  const result = await generateJsonResponse(prompt);
  const evaluation = result.evaluation || {};

  return {
    evaluation: {
      score: normalizeScore(evaluation.score),
      technicalScore: normalizeScore(
        evaluation.technicalScore
      ),
      communicationScore: normalizeScore(
        evaluation.communicationScore
      ),
      confidenceScore: normalizeScore(
        evaluation.confidenceScore
      ),
      answerQualityScore: normalizeScore(
        evaluation.answerQualityScore
      ),
      resumeAuthenticityScore: normalizeScore(
        evaluation.resumeAuthenticityScore
      ),
      strengths:
        cleanText(evaluation.strengths) ||
        "The candidate attempted to answer the question.",
      improvements:
        cleanText(evaluation.improvements) ||
        "Include more specific technical details and examples.",
      feedback:
        cleanText(evaluation.feedback) ||
        "Continue providing clear and detailed answers.",
    },

    isComplete: isFinalQuestion,

    nextQuestion: isFinalQuestion
      ? null
      : cleanText(result.nextQuestion) ||
        "Choose another skill or project from your resume and explain how you used it.",
  };
}

/**
 * Generates the final interview report after all questions are answered.
 */
async function generateFinalReport({
  resumeContext,
  targetRole,
  difficulty,
  interviewConversation,
  calculatedScores,
}) {
  if (!cleanText(interviewConversation)) {
    throw new Error(
      "Interview conversation is required to generate the final report."
    );
  }

  const scoreContext = calculatedScores
    ? JSON.stringify(calculatedScores, null, 2)
    : "No calculated score summary was provided.";

  const prompt = `
You are a senior interviewer preparing the final report for an
entry-level resume-based interview.

Target role:
${cleanText(targetRole) || "Entry-Level Software Developer"}

Difficulty:
${cleanText(difficulty) || "Medium"}

Candidate resume:
${resumeContext}

Complete interview conversation:
${interviewConversation}

Scores calculated from individual answers:
${scoreContext}

Generate a fair and professional final interview report.

Return only valid JSON using exactly this structure:

{
  "technicalScore": 7.5,
  "communicationScore": 8,
  "confidenceScore": 7,
  "answerQualityScore": 7.5,
  "resumeAuthenticityScore": 8,
  "overallScore": 7.6,
  "strengths": [
    "First overall strength",
    "Second overall strength",
    "Third overall strength"
  ],
  "improvements": [
    "First area for improvement",
    "Second area for improvement",
    "Third area for improvement"
  ],
  "finalFeedback": "A concise final assessment of the candidate",
  "hiringRecommendation": "Highly Recommended, Recommended, Consider or Needs Improvement"
}

Rules:

- Every score must be between 0 and 10.
- Use the complete interview, not only the final answer.
- Be fair to an entry-level candidate.
- Do not invent qualifications or experience.
- Strengths must contain at least three useful points.
- Improvements must contain at least three useful points.
- The hiring recommendation must be exactly one of:
  - Highly Recommended
  - Recommended
  - Consider
  - Needs Improvement
- Do not include markdown.
- Do not include code fences.
- Return only valid JSON.
`;

  const result = await generateJsonResponse(prompt);

  const technicalScore = normalizeScore(
    result.technicalScore
  );

  const communicationScore = normalizeScore(
    result.communicationScore
  );

  const confidenceScore = normalizeScore(
    result.confidenceScore
  );

  const answerQualityScore = normalizeScore(
    result.answerQualityScore
  );

  const resumeAuthenticityScore = normalizeScore(
    result.resumeAuthenticityScore
  );

  const overallScore = normalizeScore(
    result.overallScore
  );

  const strengths = normalizeStringArray(result.strengths);

  const improvements = normalizeStringArray(
    result.improvements
  );

  return {
    technicalScore,
    communicationScore,
    confidenceScore,
    answerQualityScore,
    resumeAuthenticityScore,
    overallScore,

    strengths:
      strengths.length > 0
        ? strengths
        : [
            "Completed all resume-based questions.",
            "Demonstrated familiarity with resume content.",
            "Maintained a professional interview approach.",
          ],

    improvements:
      improvements.length > 0
        ? improvements
        : [
            "Include more detailed technical explanations.",
            "Explain individual project contributions clearly.",
            "Support answers with practical examples.",
          ],

    finalFeedback:
      cleanText(result.finalFeedback) ||
      "The candidate completed the resume-based interview. Continued practice with structured and technically detailed answers is recommended.",

    hiringRecommendation: normalizeRecommendation(
      result.hiringRecommendation,
      overallScore
    ),
  };
}

module.exports = {
  generateFirstQuestion,
  evaluateAnswer,
  generateFinalReport,
};