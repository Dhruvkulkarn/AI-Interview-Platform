const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      default: "",
      trim: true,
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
    },

    strengths: {
      type: String,
      default: "",
      trim: true,
    },

    improvements: {
      type: String,
      default: "",
      trim: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    technicalScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    communicationScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    answerQualityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    interviewType: {
      type: String,
      enum: [
        "Standard",
        "HR Chat",
        "Resume Based",
      ],
      default: "Standard",
      index: true,
    },

    resumeAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeAnalysis",
      default: null,
    },

    resumeFileName: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    questions: {
      type: [interviewQuestionSchema],
      default: [],
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    technicalScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    communicationScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    answerQualityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    resumeAuthenticityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    strengths: {
      type: [String],
      default: [],
    },

    improvements: {
      type: [String],
      default: [],
    },

    finalFeedback: {
      type: String,
      default: "",
      trim: true,
    },

    hiringRecommendation: {
      type: String,
      enum: [
        "",
        "Highly Recommended",
        "Recommended",
        "Consider",
        "Needs Improvement",
      ],
      default: "",
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed"],
      default: "In Progress",
    },
  },
  {
    timestamps: true,
  }
);

const Interview =
  mongoose.models.Interview ||
  mongoose.model("Interview", interviewSchema);

module.exports = Interview;