require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const interviewRoutes = require("./routes/interviewRoutes");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const connectDatabase = require("./config/db");
const resumeInterviewRoutes = require("./routes/resumeInterviewRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

connectDatabase();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/resume-interview", resumeInterviewRoutes);

console.log(
  "Gemini API key loaded:",
  Boolean(process.env.GEMINI_API_KEY)
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const HR_CHAT_QUESTION_LIMIT = 5;

const questions = {
  react: [
    "What is React?",
    "What is a component in React?",
    "What are props in React?",
    "What is useState?",
    "What is the difference between props and state?",
  ],

  java: [
    "What is Java?",
    "What is object-oriented programming?",
    "What is the difference between a class and an object?",
    "What is inheritance?",
    "What is exception handling?",
  ],

  hr: [
    "Tell me about yourself.",
    "What are your strengths?",
    "What is one weakness you are working on?",
    "Why should we hire you?",
    "Where do you see yourself in five years?",
  ],
};

function removeMarkdownCodeFences(text) {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractJson(text) {
  const cleanedText = removeMarkdownCodeFences(text);

  try {
    return JSON.parse(cleanedText);
  } catch (firstError) {
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Gemini did not return valid JSON.");
    }

    const possibleJson = cleanedText.slice(
      firstBrace,
      lastBrace + 1
    );

    try {
      return JSON.parse(possibleJson);
    } catch (secondError) {
      console.error("Unable to parse Gemini JSON:", cleanedText);

      throw new Error(
        "Gemini returned an invalid response. Please try again."
      );
    }
  }
}

function normalizeScore(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return Number(
    Math.min(Math.max(numberValue, 0), 10).toFixed(1)
  );
}

function normalizeTextArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function formatConversation(conversation) {
  if (!Array.isArray(conversation) || conversation.length === 0) {
    return "No previous conversation.";
  }

  return conversation
    .map((message, index) => {
      const speaker =
        message.sender === "ai" ? "Interviewer" : "Candidate";

      return `${index + 1}. ${speaker}: ${String(
        message.text || ""
      ).trim()}`;
    })
    .join("\n");
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Interview Platform backend is running",
  });
});

app.get("/api/questions/:role", (req, res) => {
  const role = req.params.role.toLowerCase();
  const roleQuestions = questions[role];

  if (!roleQuestions) {
    return res.status(404).json({
      success: false,
      message: "Interview role not found.",
    });
  }

  return res.json({
    success: true,
    role,
    questions: roleQuestions,
  });
});

app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const { role, question, answer } = req.body;

    console.log("Evaluation request received");
    console.log("Role:", role);
    console.log("Question:", question);

    if (!role || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Role, question and answer are required.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing from the .env file.",
      });
    }

    const prompt = `
You are an experienced job interviewer.

Interview role: ${role}

Interview question:
${question}

Candidate answer:
${answer}

Evaluate the candidate's answer.

Return only valid JSON in this exact format:

{
  "score": 7,
  "strengths": "What was good about the answer",
  "improvements": "What the candidate should improve",
  "idealAnswer": "A better example answer"
}

Rules:
- Score must be between 0 and 10.
- Keep the feedback concise.
- Do not include markdown.
- Do not include code fences.
- Return only JSON.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;

    console.log("Gemini response:", responseText);

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedEvaluation = extractJson(responseText);

    const evaluation = {
      score: normalizeScore(parsedEvaluation.score),
      strengths:
        parsedEvaluation.strengths ||
        "The answer addressed the interview question.",
      improvements:
        parsedEvaluation.improvements ||
        "Add clearer details and a relevant example.",
      idealAnswer:
        parsedEvaluation.idealAnswer ||
        "Provide a structured answer with a clear example.",
    };

    return res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Gemini evaluation error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to evaluate the interview answer.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| AI HR CHAT INTERVIEW
|--------------------------------------------------------------------------
| Starts a conversational HR interview.
*/
app.post("/api/hr-chat/start", async (req, res) => {
  try {
    const { candidateName } = req.body;

    const safeCandidateName =
      String(candidateName || "").trim() || "Candidate";

    return res.json({
      success: true,
      interview: {
        candidateName: safeCandidateName,
        totalQuestions: HR_CHAT_QUESTION_LIMIT,
        currentQuestionNumber: 1,
        firstQuestion:
          "Please introduce yourself and tell me briefly about your education, skills and career goals.",
      },
    });
  } catch (error) {
    console.error("HR chat start error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start the HR interview.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| AI HR CHAT RESPONSE
|--------------------------------------------------------------------------
| Evaluates the candidate's current answer and generates the next question.
| After five answers, it generates the final interview report.
*/
app.post("/api/hr-chat/respond", async (req, res) => {
  try {
    const {
      candidateName,
      question,
      answer,
      questionNumber,
      conversation,
      previousEvaluations,
    } = req.body;

    const safeCandidateName =
      String(candidateName || "").trim() || "Candidate";

    const safeQuestion = String(question || "").trim();
    const safeAnswer = String(answer || "").trim();
    const currentQuestionNumber = Number(questionNumber);

    if (!safeQuestion || !safeAnswer || !currentQuestionNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Question, answer and question number are required.",
      });
    }

    if (safeAnswer.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a more detailed answer before continuing.",
      });
    }

    if (
      currentQuestionNumber < 1 ||
      currentQuestionNumber > HR_CHAT_QUESTION_LIMIT
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid HR interview question number.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing from the .env file.",
      });
    }

    const isLastQuestion =
      currentQuestionNumber >= HR_CHAT_QUESTION_LIMIT;

    const conversationText =
      formatConversation(conversation);

    const prompt = `
You are a professional HR interviewer conducting a realistic
entry-level job interview.

Candidate name:
${safeCandidateName}

Current question number:
${currentQuestionNumber} of ${HR_CHAT_QUESTION_LIMIT}

Current HR question:
${safeQuestion}

Candidate's current answer:
${safeAnswer}

Previous interview conversation:
${conversationText}

Your tasks:

1. Evaluate only the candidate's current answer.
2. Give useful and encouraging feedback.
3. Score communication, confidence, professionalism and answer quality.
4. Give an overall score for the current answer.
5. ${
      isLastQuestion
        ? "This is the final question. Do not generate another question. Generate a final interview report."
        : "Generate one natural follow-up HR question based on the candidate's previous answers. Do not repeat an earlier question."
    }

${
  isLastQuestion
    ? `
Return only valid JSON in exactly this structure:

{
  "evaluation": {
    "score": 7.5,
    "communicationScore": 7,
    "confidenceScore": 7,
    "professionalismScore": 8,
    "answerQualityScore": 7,
    "strengths": "What was good about this answer",
    "improvements": "What should be improved",
    "interviewerReply": "A short natural response to the candidate"
  },
  "isComplete": true,
  "nextQuestion": null,
  "finalReport": {
    "communicationScore": 7.5,
    "confidenceScore": 7,
    "professionalismScore": 8,
    "answerQualityScore": 7,
    "overallScore": 7.4,
    "strengths": [
      "First overall strength",
      "Second overall strength",
      "Third overall strength"
    ],
    "improvements": [
      "First overall improvement",
      "Second overall improvement",
      "Third overall improvement"
    ],
    "finalFeedback": "A concise final assessment of the candidate",
    "hiringRecommendation": "Recommended, Consider or Needs Improvement"
  }
}
`
    : `
Return only valid JSON in exactly this structure:

{
  "evaluation": {
    "score": 7.5,
    "communicationScore": 7,
    "confidenceScore": 7,
    "professionalismScore": 8,
    "answerQualityScore": 7,
    "strengths": "What was good about this answer",
    "improvements": "What should be improved",
    "interviewerReply": "A short natural response to the candidate"
  },
  "isComplete": false,
  "nextQuestion": "One relevant follow-up HR question",
  "finalReport": null
}
`
}

Rules:
- Every score must be between 0 and 10.
- Judge the answer fairly for an entry-level candidate.
- Do not punish the candidate for being a fresher.
- The next question must be professional and appropriate.
- Do not ask technical programming questions.
- Avoid repeating previous questions.
- Keep feedback concise and practical.
- Do not include markdown.
- Do not include code fences.
- Return only valid JSON.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;

    console.log(
      `HR chat response for question ${currentQuestionNumber}:`,
      responseText
    );

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedResponse = extractJson(responseText);
    const parsedEvaluation =
      parsedResponse.evaluation || {};

    const evaluation = {
      question: safeQuestion,
      answer: safeAnswer,
      score: normalizeScore(parsedEvaluation.score),
      communicationScore: normalizeScore(
        parsedEvaluation.communicationScore
      ),
      confidenceScore: normalizeScore(
        parsedEvaluation.confidenceScore
      ),
      professionalismScore: normalizeScore(
        parsedEvaluation.professionalismScore
      ),
      answerQualityScore: normalizeScore(
        parsedEvaluation.answerQualityScore
      ),
      strengths:
        parsedEvaluation.strengths ||
        "The answer was relevant to the question.",
      improvements:
        parsedEvaluation.improvements ||
        "Add a clearer example and more specific details.",
      interviewerReply:
        parsedEvaluation.interviewerReply ||
        "Thank you for sharing that answer.",
    };

    let finalReport = null;

    if (isLastQuestion) {
      const report = parsedResponse.finalReport || {};

      const allEvaluations = [
        ...(Array.isArray(previousEvaluations)
          ? previousEvaluations
          : []),
        evaluation,
      ];

      const calculateAverage = (field) => {
        if (allEvaluations.length === 0) {
          return 0;
        }

        const total = allEvaluations.reduce(
          (sum, item) => sum + normalizeScore(item[field]),
          0
        );

        return normalizeScore(total / allEvaluations.length);
      };

      const calculatedCommunication =
        calculateAverage("communicationScore");

      const calculatedConfidence =
        calculateAverage("confidenceScore");

      const calculatedProfessionalism =
        calculateAverage("professionalismScore");

      const calculatedAnswerQuality =
        calculateAverage("answerQualityScore");

      const calculatedOverall = normalizeScore(
        allEvaluations.reduce(
          (sum, item) => sum + normalizeScore(item.score),
          0
        ) / allEvaluations.length
      );

      finalReport = {
        communicationScore:
  report.communicationScore !== undefined
    ? normalizeScore(report.communicationScore)
    : calculatedCommunication,

confidenceScore:
  report.confidenceScore !== undefined
    ? normalizeScore(report.confidenceScore)
    : calculatedConfidence,

professionalismScore:
  report.professionalismScore !== undefined
    ? normalizeScore(report.professionalismScore)
    : calculatedProfessionalism,

answerQualityScore:
  report.answerQualityScore !== undefined
    ? normalizeScore(report.answerQualityScore)
    : calculatedAnswerQuality,

overallScore:
  report.overallScore !== undefined
    ? normalizeScore(report.overallScore)
    : calculatedOverall,

        strengths:
          normalizeTextArray(report.strengths).length > 0
            ? normalizeTextArray(report.strengths)
            : [
                "Answered all interview questions.",
                "Maintained a professional approach.",
                "Demonstrated willingness to communicate.",
              ],

        improvements:
          normalizeTextArray(report.improvements).length > 0
            ? normalizeTextArray(report.improvements)
            : [
                "Use more specific examples.",
                "Structure answers more clearly.",
                "Practise delivering answers confidently.",
              ],

        finalFeedback:
          report.finalFeedback ||
          "You completed the HR interview successfully. Continue practising structured and confident answers.",

        hiringRecommendation:
          report.hiringRecommendation || "Consider",
      };
    }

    return res.json({
      success: true,
      evaluation,
      isComplete: isLastQuestion,
      nextQuestion: isLastQuestion
        ? null
        : parsedResponse.nextQuestion ||
          "Can you describe a challenge you faced and how you handled it?",
      finalReport,
    });
  } catch (error) {
    console.error("HR chat response error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to continue the AI HR interview.",
    });
  }
});

app.get("/api/models", async (req, res) => {
  try {
    const availableModels = [];

    const modelList = await ai.models.list({
      config: {
        pageSize: 100,
      },
    });

    for await (const model of modelList) {
      availableModels.push({
        name: model.name,
        supportedActions: model.supportedActions,
      });
    }

    return res.json({
      success: true,
      models: availableModels,
    });
  } catch (error) {
    console.error("Model list error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});