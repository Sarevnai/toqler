import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardProfiles from "./pages/DashboardProfiles";
import DashboardCards from "./pages/DashboardCards";
import DashboardLeads from "./pages/DashboardLeads";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardIntegrations from "./pages/DashboardIntegrations";
import DashboardSettings from "./pages/DashboardSettings";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/p/:profileId" element={<PublicProfile />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="profiles" element={<DashboardProfiles />} />
              <Route path="cards" element={<DashboardCards />} />
              <Route path="leads" element={<DashboardLeads />} />
              <Route path="analytics" element={<DashboardAnalytics />} />
              <Route path="integrations" element={<DashboardIntegrations />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
