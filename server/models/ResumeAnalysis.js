const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    resumeText: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    technologies: {
      type: [String],
      default: [],
    },

    projects: {
      type: [
        {
          name: {
            type: String,
            default: "",
          },

          description: {
            type: String,
            default: "",
          },

          technologies: {
            type: [String],
            default: [],
          },
        },
      ],
      default: [],
    },

    education: {
      type: [
        {
          qualification: {
            type: String,
            default: "",
          },

          institution: {
            type: String,
            default: "",
          },

          year: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },

    experience: {
      type: [
        {
          role: {
            type: String,
            default: "",
          },

          organization: {
            type: String,
            default: "",
          },

          duration: {
            type: String,
            default: "",
          },

          description: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    overallRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    interviewReadinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    professionalSummary: {
      type: String,
      default: "",
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    improvementSuggestions: {
      type: [String],
      default: [],
    },

    bestJobRoles: {
      type: [String],
      default: [],
    },

    keywordSuggestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ResumeAnalysis =
  mongoose.models.ResumeAnalysis ||
  mongoose.model(
    "ResumeAnalysis",
    resumeAnalysisSchema
  );

module.exports = ResumeAnalysis;