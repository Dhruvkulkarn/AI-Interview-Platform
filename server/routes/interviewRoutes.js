const express = require("express");

const {
  createInterview,
  getMyInterviews,
  deleteInterview,
  clearMyInterviews,
  getInterviewAnalytics,
} = require("../controllers/interviewController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/analytics", protect, getInterviewAnalytics);

router.post("/", protect, createInterview);
router.get("/", protect, getMyInterviews);

router.delete("/", protect, clearMyInterviews);
router.delete("/:id", protect, deleteInterview);

module.exports = router;