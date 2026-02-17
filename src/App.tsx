import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const DashboardOverview = lazy(() => import("./pages/DashboardOverview"));
const DashboardProfiles = lazy(() => import("./pages/DashboardProfiles"));
const DashboardCards = lazy(() => import("./pages/DashboardCards"));
const DashboardLeads = lazy(() => import("./pages/DashboardLeads"));
const DashboardAnalytics = lazy(() => import("./pages/DashboardAnalytics"));
const DashboardIntegrations = lazy(() => import("./pages/DashboardIntegrations"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const DashboardAppearance = lazy(() => import("./pages/DashboardAppearance"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const CardRedirect = lazy(() => import("./pages/CardRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const PublicOnlyRoute = lazy(() => import("./components/auth/PublicOnlyRoute"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerDetail = lazy(() => import("./pages/admin/AdminCustomerDetail"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/p/:profileId" element={<PublicProfile />} />
                <Route path="/c/*" element={<CardRedirect />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="profiles" element={<DashboardProfiles />} />
                  <Route path="cards" element={<DashboardCards />} />
                  <Route path="leads" element={<DashboardLeads />} />
                  <Route path="analytics" element={<DashboardAnalytics />} />
                  <Route path="appearance" element={<DashboardAppearance />} />
                  <Route path="integrations" element={<DashboardIntegrations />} />
                  <Route path="settings" element={<DashboardSettings />} />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="customers/:companyId" element={<AdminCustomerDetail />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
