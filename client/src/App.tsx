import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import GrantOpportunities from "./pages/GrantOpportunities";
import Applications from "./pages/Applications";
import Documents from "./pages/Documents";
import ImpactReportsNew from "./pages/ImpactReportsNew";
import TestAIReport from "./pages/TestAIReport";
import Organization from "./pages/Organization";
import Settings from "./pages/Settings";
import StorageCentre from "./pages/StorageCentre";
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';

function Router() {
  return (
    <Switch>
      {/* Auth routes (public) */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      
      {/* Protected routes */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/opportunities">
        <DashboardLayout>
          <GrantOpportunities />
        </DashboardLayout>
      </Route>
      <Route path="/applications">
        <DashboardLayout>
          <Applications />
        </DashboardLayout>
      </Route>
      <Route path="/documents">
        <DashboardLayout>
          <Documents />
        </DashboardLayout>
      </Route>
      <Route path="/reports">
        <DashboardLayout>
          <ImpactReportsNew />
        </DashboardLayout>
      </Route>
      <Route path="/test-ai">
        <TestAIReport />
      </Route>
      <Route path="/organization">
        <DashboardLayout>
          <Organization />
        </DashboardLayout>
      </Route>
      <Route path="/settings">
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>
      <Route path="/storage-centre">
        <DashboardLayout>
          <StorageCentre />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
