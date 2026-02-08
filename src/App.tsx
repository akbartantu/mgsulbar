import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import OutboxPage from "./pages/OutboxPage";
import DraftsPage from "./pages/DraftsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ArchivePage from "./pages/ArchivePage";
import LacakSuratPage from "./pages/LacakSuratPage";
import CreateLetterPage from "./pages/CreateLetterPage";
import AwardeeDatabasePage from "./pages/AwardeeDatabasePage";
import ProgramMonitoringPage from "./pages/ProgramMonitoringPage";
import FinancePage from "./pages/FinancePage";
import MembersPage from "./pages/MembersPage";
import ConfigPage from "./pages/ConfigPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/outbox" element={<ProtectedRoute><OutboxPage /></ProtectedRoute>} />
          <Route path="/drafts" element={<ProtectedRoute><DraftsPage /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><ArchivePage /></ProtectedRoute>} />
          <Route path="/lacak" element={<ProtectedRoute><LacakSuratPage /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateLetterPage /></ProtectedRoute>} />
          <Route path="/create/:id" element={<ProtectedRoute><CreateLetterPage /></ProtectedRoute>} />
          <Route path="/awardees" element={<ProtectedRoute><AwardeeDatabasePage /></ProtectedRoute>} />
          <Route path="/programs" element={<ProtectedRoute><ProgramMonitoringPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
          <Route path="/pengaturan" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
