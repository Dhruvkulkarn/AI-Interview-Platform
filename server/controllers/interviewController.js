const Interview = require("../models/Interview");

// Create a new interview
const createInterview = async (req, res) => {
  try {
    const {
      role,
      difficulty,
      questions,
      overallScore,
      status,
    } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const interview = await Interview.create({
      user: req.user._id,
      role,
      difficulty,
      questions,
      overallScore,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Interview saved successfully",
      interview,
    });
  } catch (error) {
    console.error("Create interview error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save interview",
    });
  }
};

// Get all interviews of logged-in user
const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    console.error("Get interviews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
    });
  }
};

// Delete one interview
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    await interview.deleteOne();

    res.status(200).json({
      success: true,
      message: "Interview deleted successfully",
    });
  } catch (error) {
    console.error("Delete interview error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete interview",
    });
  }
};

// Delete all interviews of the logged-in user
const clearMyInterviews = async (req, res) => {
  try {
    const result = await Interview.deleteMany({
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Interview history cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear interviews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear interview history",
    });
  }
};

// Get analytics for the logged-in user
const getInterviewAnalytics = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user._id,
      status: "Completed",
    }).sort({ createdAt: 1 });

    const totalInterviews = interviews.length;

    if (totalInterviews === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalInterviews: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          latestScore: 0,
          rolePerformance: [],
          scoreProgress: [],
        },
      });
    }

    const scores = interviews.map((interview) =>
      Number(interview.overallScore || 0)
    );

    const totalScore = scores.reduce(
      (total, score) => total + score,
      0
    );

    const averageScore = Number(
      (totalScore / totalInterviews).toFixed(1)
    );

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const latestScore = scores[scores.length - 1];

    const roleGroups = {};

    interviews.forEach((interview) => {
      const role = interview.role || "Unknown";
      const score = Number(interview.overallScore || 0);

      if (!roleGroups[role]) {
        roleGroups[role] = {
          totalScore: 0,
          count: 0,
        };
      }

      roleGroups[role].totalScore += score;
      roleGroups[role].count += 1;
    });

    const rolePerformance = Object.entries(roleGroups).map(
      ([role, values]) => ({
        role,
        interviewCount: values.count,
        averageScore: Number(
          (values.totalScore / values.count).toFixed(1)
        ),
      })
    );

    const scoreProgress = interviews.map(
      (interview, index) => ({
        interviewNumber: index + 1,
        role: interview.role,
        score: Number(interview.overallScore || 0),
        date: interview.createdAt,
      })
    );

    res.status(200).json({
      success: true,
      analytics: {
        totalInterviews,
        averageScore,
        highestScore,
        lowestScore,
        latestScore,
        rolePerformance,
        scoreProgress,
      },
    });
  } catch (error) {
    console.error("Interview analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load interview analytics",
    });
  }
};

module.exports = {
  createInterview,
  getMyInterviews,
  deleteInterview,
  clearMyInterviews,
  getInterviewAnalytics,
};