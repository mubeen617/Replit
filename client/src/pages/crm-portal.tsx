import { useState } from "react";
import { Switch, Route } from "wouter";
import CRMLogin from "./crm-login";
import CRMLayout from "@/components/layout/crm-layout";
import CRMDashboard from "./crm/crm-dashboard";
import CRMLeads from "./crm/crm-leads";
import CRMQuotes from "./crm/crm-quotes";
import CRMOrders from "./crm/crm-orders";
import CRMDispatch from "./crm/crm-dispatch";
import CRMTeam from "./crm/crm-team";
import AdminSettings from "./crm/settings/admin-settings";
import UserSettings from "./crm/settings/user-settings";
import type { Customer, CustomerUser } from "@shared/schema";

interface CRMUser {
  type: "customer" | "user";
  data: Customer | CustomerUser;
}

export default function CRMPortal() {
  const [currentUser, setCurrentUser] = useState<CRMUser | null>(null);

  const handleLogin = (user: CRMUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <CRMLogin onLogin={handleLogin} />;
  }

  return (
    <CRMLayout
      user={currentUser.data}
      userType={currentUser.type}
      onLogout={handleLogout}
    >
      <Switch>
        {/* Dashboard */}
        <Route path="/crm/dashboard" component={() => (
          <CRMDashboard user={currentUser.data} userType={currentUser.type} />
        )} />
        {/* Leads - visible to both */}
        <Route path="/crm/leads" component={() => (
          <CRMLeads user={currentUser.data} userType={currentUser.type} />
        )} />
        {/* User-only routes */}
        {currentUser.type === "user" && (
          <>
            <Route path="/crm/quotes" component={() => (
              <CRMQuotes user={currentUser.data} userType={currentUser.type} />
            )} />
            <Route path="/crm/orders" component={() => (
              <CRMOrders user={currentUser.data} userType={currentUser.type} />
            )} />
            <Route path="/crm/dispatch" component={() => (
              <CRMDispatch user={currentUser.data} userType={currentUser.type} />
            )} />
          </>
        )}
        {/* Admin-only routes */}
        {currentUser.type === "customer" && (
          <Route path="/crm/team" component={() => (
            <CRMTeam user={currentUser.data as Customer} userType="customer" />
          )} />
        )}
        {/* Reports - admin only */}
        {currentUser.type === "customer" && (
          <Route path="/crm/reports" component={() => (
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-1">Analytics and reporting dashboard coming soon...</p>
            </div>
          )} />
        )}

        {/* Settings Routes */}
        <Route path="/crm/settings" component={() => (
          <div className="p-6 max-w-4xl mx-auto">
            {currentUser.type === "customer" ? (
              <AdminSettings customer={currentUser.data as Customer} />
            ) : (
              <UserSettings user={currentUser.data as CustomerUser} />
            )}
          </div>
        )} />

        {/* Default redirect to dashboard */}
        <Route component={() => (
          <CRMDashboard user={currentUser.data} userType={currentUser.type} />
        )} />
      </Switch>
    </CRMLayout>
  );
}