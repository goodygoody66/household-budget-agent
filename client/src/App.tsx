import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ReceiptUpload from "./pages/ReceiptUpload";
import SupermarketManagement from "./pages/SupermarketManagement";
import { FlyerAnalysisTest } from "./pages/FlyerAnalysisTest";
import { SmartMatchingReport } from "./pages/SmartMatchingReport";
import { ReceiptAnalysisTest } from "./pages/ReceiptAnalysisTest";
import { ReceiptFlyerMatching } from "./pages/ReceiptFlyerMatching";
// import { NotificationTest } from "./pages/NotificationTest";
import { LocalAuthSetup } from "./pages/LocalAuthSetup";

function Router() {
  return (
    <Switch>
      <Route path={"/local-auth-setup"} component={LocalAuthSetup} />
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/receipt/upload"} component={ReceiptUpload} />
      <Route path={"/supermarket"} component={SupermarketManagement} />
      <Route path={"/flyer-test"} component={FlyerAnalysisTest} />
      <Route path={"/smart-matching"} component={SmartMatchingReport} />
      <Route path={"/receipt-analysis-test"} component={ReceiptAnalysisTest} />
      <Route path={"/receipt-flyer-matching"} component={ReceiptFlyerMatching} />
      {/* <Route path={"/notification-test"} component={NotificationTest} /> */}
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
