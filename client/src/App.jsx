import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import HRChatInterview from "./pages/HRChatInterview";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeHistory from "./pages/ResumeHistory";
import ResumeReport from "./pages/ResumeReport";
import ResumeInterviewSelection from "./pages/ResumeInterviewSelection";
import ResumeInterview from "./pages/ResumeInterview";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/interview/:role"
            element={<Interview />}
          />

          <Route
            path="/hr-chat-interview"
            element={<HRChatInterview />}
          />

          <Route
            path="/resume-analyzer"
            element={<ResumeAnalyzer />}
          />

          <Route
            path="/resume-history"
            element={<ResumeHistory />}
          />

          <Route
            path="/resume-history/:id"
            element={<ResumeReport />}
          />

          <Route
            path="/resume-interview-selection"
            element={<ResumeInterviewSelection />}
          />

          <Route
            path="/resume-interview/:interviewId"
            element={<ResumeInterview />}
          />

          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Invalid route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;