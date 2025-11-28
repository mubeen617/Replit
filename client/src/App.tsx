import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Users from "@/pages/users";
import CRMPortal from "@/pages/crm-portal";
import UserPortal from "@/pages/user-portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/crm" component={CRMPortal} />
      <Route path="/crm/:rest*" component={CRMPortal} />
      <Route path="/crm-portal" component={CRMPortal} />
      <Route path="/" component={Dashboard} />
      <Route path="/customers" component={Customers} />
      <Route path="/users" component={Users} />
      <Route path="/user-portal" component={UserPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
