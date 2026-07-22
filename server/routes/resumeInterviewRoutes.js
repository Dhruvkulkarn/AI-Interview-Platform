const express = require("express");

const {
  startInterview,
  submitAnswer,
} = require("../controllers/resumeInterviewController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/start", protect, startInterview);

router.post(
  "/:interviewId/answer",
  protect,
  submitAnswer
);

module.exports = router;