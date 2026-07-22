const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const ResumeAnalysis = require("../models/ResumeAnalysis");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function cleanGeminiResponse(responseText) {
  const cleanedText = String(responseText || "")
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    const jsonStart = cleanedText.indexOf("{");
    const jsonEnd = cleanedText.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(
        "Gemini did not return a valid JSON response."
      );
    }

    const extractedJson = cleanedText.slice(
      jsonStart,
      jsonEnd + 1
    );

    try {
      return JSON.parse(extractedJson);
    } catch {
      console.error(
        "Unable to parse Gemini resume response:",
        cleanedText
      );

      throw new Error(
        "Gemini returned an invalid resume analysis. Please try again."
      );
    }
  }
}

function normalizeNumber(value, minimum, maximum) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, number));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeProjects(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((project) => {
      if (typeof project === "string") {
        return {
          name: normalizeText(project),
          description: "",
          technologies: [],
        };
      }

      if (!project || typeof project !== "object") {
        return null;
      }

      return {
        name: normalizeText(project.name),
        description: normalizeText(project.description),
        technologies: normalizeArray(
          project.technologies
        ),
      };
    })
    .filter(
      (project) =>
        project &&
        (project.name ||
          project.description ||
          project.technologies.length > 0)
    );
}

function normalizeEducation(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((educationItem) => {
      if (typeof educationItem === "string") {
        return {
          qualification: normalizeText(educationItem),
          institution: "",
          year: "",
        };
      }

      if (
        !educationItem ||
        typeof educationItem !== "object"
      ) {
        return null;
      }

      return {
        qualification: normalizeText(
          educationItem.qualification
        ),
        institution: normalizeText(
          educationItem.institution
        ),
        year: normalizeText(educationItem.year),
      };
    })
    .filter(
      (educationItem) =>
        educationItem &&
        (educationItem.qualification ||
          educationItem.institution ||
          educationItem.year)
    );
}

function normalizeExperience(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((experienceItem) => {
      if (typeof experienceItem === "string") {
        return {
          role: normalizeText(experienceItem),
          organization: "",
          duration: "",
          description: "",
        };
      }

      if (
        !experienceItem ||
        typeof experienceItem !== "object"
      ) {
        return null;
      }

      return {
        role: normalizeText(experienceItem.role),
        organization: normalizeText(
          experienceItem.organization
        ),
        duration: normalizeText(
          experienceItem.duration
        ),
        description: normalizeText(
          experienceItem.description
        ),
      };
    })
    .filter(
      (experienceItem) =>
        experienceItem &&
        (experienceItem.role ||
          experienceItem.organization ||
          experienceItem.duration ||
          experienceItem.description)
    );
}

// Analyze and save a resume
async function analyzeResume(req, res) {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF resume.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "Gemini API key is missing from the .env file.",
      });
    }

    parser = new PDFParse({
      data: req.file.buffer,
    });

    const pdfResult = await parser.getText();
    const extractedText = normalizeText(pdfResult.text);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text was found. Please upload a text-based PDF resume.",
      });
    }

    const resumeText = extractedText.slice(0, 30000);

    const prompt = `
You are an experienced technical recruiter, ATS specialist,
career coach and resume reviewer.

Analyze the following candidate resume carefully.

Resume:
${resumeText}

Return only valid JSON in this exact format:

{
  "atsScore": 80,
  "overallRating": 8,
  "professionalSummary": "A short professional assessment of the resume.",

  "skills": [
    "Skill one",
    "Skill two"
  ],

  "technologies": [
    "Technology one",
    "Technology two"
  ],

  "projects": [
    {
      "name": "Project name",
      "description": "Short description of what the project does",
      "technologies": [
        "Technology used"
      ]
    }
  ],

  "education": [
    {
      "qualification": "Degree or qualification",
      "institution": "Institution name",
      "year": "Year or duration"
    }
  ],

  "experience": [
    {
      "role": "Job or internship role",
      "organization": "Company or organization",
      "duration": "Employment duration",
      "description": "Short description of responsibilities"
    }
  ],

  "certifications": [
    "Certification name"
  ],

  "strengths": [
    "First resume strength",
    "Second resume strength"
  ],

  "weaknesses": [
    "First resume weakness",
    "Second resume weakness"
  ],

  "missingSkills": [
    "Important missing skill",
    "Another useful skill"
  ],

  "improvementSuggestions": [
    "First practical improvement",
    "Second practical improvement"
  ],

  "bestJobRoles": [
    "Most suitable job role",
    "Another suitable job role"
  ],

  "interviewReadinessScore": 7,

  "keywordSuggestions": [
    "ATS keyword one",
    "ATS keyword two"
  ]
}

Rules:
- atsScore must be between 0 and 100.
- overallRating must be between 0 and 10.
- interviewReadinessScore must be between 0 and 10.
- Base the analysis only on the resume.
- Do not invent education, experience, projects, certifications or skills.
- Extract all projects, skills, education, certifications and experience exactly from the resume.
- If a section is not present in the resume, return an empty array.
- Skills should contain candidate abilities such as React, Java, communication or problem solving.
- Technologies should contain programming languages, frameworks, databases, tools and platforms.
- Keep project descriptions concise and factual.
- Keep the professional summary concise.
- Give clear and practical feedback.
- Do not include markdown.
- Do not include code fences.
- Return only valid JSON.
`;

    const geminiResponse =
      await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

    const responseText = geminiResponse.text;

    if (!responseText) {
      throw new Error(
        "Gemini returned an empty resume analysis."
      );
    }

    const rawAnalysis =
      cleanGeminiResponse(responseText);

    const analysisData = {
      resumeText,

      atsScore: normalizeNumber(
        rawAnalysis.atsScore,
        0,
        100
      ),

      overallRating: normalizeNumber(
        rawAnalysis.overallRating,
        0,
        10
      ),

      professionalSummary:
        normalizeText(
          rawAnalysis.professionalSummary
        ) || "Resume analysis completed.",

      skills: normalizeArray(rawAnalysis.skills),

      technologies: normalizeArray(
        rawAnalysis.technologies
      ),

      projects: normalizeProjects(
        rawAnalysis.projects
      ),

      education: normalizeEducation(
        rawAnalysis.education
      ),

      experience: normalizeExperience(
        rawAnalysis.experience
      ),

      certifications: normalizeArray(
        rawAnalysis.certifications
      ),

      strengths: normalizeArray(
        rawAnalysis.strengths
      ),

      weaknesses: normalizeArray(
        rawAnalysis.weaknesses
      ),

      missingSkills: normalizeArray(
        rawAnalysis.missingSkills
      ),

      improvementSuggestions: normalizeArray(
        rawAnalysis.improvementSuggestions
      ),

      bestJobRoles: normalizeArray(
        rawAnalysis.bestJobRoles
      ),

      interviewReadinessScore: normalizeNumber(
        rawAnalysis.interviewReadinessScore,
        0,
        10
      ),

      keywordSuggestions: normalizeArray(
        rawAnalysis.keywordSuggestions
      ),
    };

    const savedAnalysis = await ResumeAnalysis.create({
      user: req.user._id,
      fileName: req.file.originalname,
      ...analysisData,
    });

    return res.status(201).json({
      success: true,
      message:
        "Resume analyzed and saved successfully.",
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to analyze the resume.",
    });
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error(
          "Unable to destroy PDF parser:",
          destroyError
        );
      }
    }
  }
}

// Get all saved resume reports
async function getResumeHistory(req, res) {
  try {
    const analyses = await ResumeAnalysis.find({
      user: req.user._id,
    })
      .select("-resumeText")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error("Resume history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load resume history.",
    });
  }
}

// Get one saved resume report
async function getResumeAnalysisById(req, res) {
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Resume analysis not found.",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error(
      "Get resume analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load the resume report.",
    });
  }
}

// Delete one saved report
async function deleteResumeAnalysis(req, res) {
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Resume analysis not found.",
      });
    }

    await analysis.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Resume report deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete resume analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete the resume report.",
    });
  }
}

// Delete all saved reports
async function clearResumeHistory(req, res) {
  try {
    const result = await ResumeAnalysis.deleteMany({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Resume history cleared successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(
      "Clear resume history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to clear resume history.",
    });
  }
}

module.exports = {
  analyzeResume,
  getResumeHistory,
  getResumeAnalysisById,
  deleteResumeAnalysis,
  clearResumeHistory,
};