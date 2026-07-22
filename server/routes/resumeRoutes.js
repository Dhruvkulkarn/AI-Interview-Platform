const express = require("express");

const upload = require("../middleware/uploadMiddleware");
const protect = require("../middleware/authMiddleware");

const {
  analyzeResume,
  getResumeHistory,
  getResumeAnalysisById,
  deleteResumeAnalysis,
  clearResumeHistory,
} = require("../controllers/resumeController");

const router = express.Router();

router.post(
  "/analyze",
  protect,
  upload.single("resume"),
  analyzeResume
);

router.get("/history", protect, getResumeHistory);

router.get(
  "/history/:id",
  protect,
  getResumeAnalysisById
);

router.delete(
  "/history/:id",
  protect,
  deleteResumeAnalysis
);

router.delete(
  "/history",
  protect,
  clearResumeHistory
);

module.exports = router;