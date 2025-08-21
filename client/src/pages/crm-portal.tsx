import { useState } from "react";
import { Route, Switch } from "wouter";
import CRMLogin from "./crm-login";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "./crm/dashboard";
import Leads from "./crm/leads";
import Agents from "./crm/agents";

export default function CRMPortal() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <CRMLogin onLogin={handleLogin} />;
  }

  const userName = currentUser.type === "customer" 
    ? currentUser.data.adminName 
    : `${currentUser.data.firstName} ${currentUser.data.lastName}`;

  return (
    <DashboardLayout 
      onLogout={handleLogout} 
      userType={currentUser.type}
      userName={userName}
    >
      <Switch>
        <Route path="/crm/dashboard">
          <Dashboard 
            customer={currentUser.type === "customer" ? currentUser.data : null}
            user={currentUser.type === "user" ? currentUser.data : null}
            userType={currentUser.type}
          />
        </Route>
        <Route path="/crm/leads">
          <Leads 
            customer={currentUser.type === "customer" ? currentUser.data : { id: currentUser.data.customerId }}
            userType={currentUser.type}
          />
        </Route>
        <Route path="/crm/agents">
          <Agents 
            customer={currentUser.type === "customer" ? currentUser.data : { id: currentUser.data.customerId }}
          />
        </Route>
        <Route path="/crm/carriers">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Carriers</h1>
            <p className="text-gray-600">Vehicle carrier management coming soon...</p>
          </div>
        </Route>
        <Route path="/crm/financial">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Financial</h1>
            <p className="text-gray-600">Financial management coming soon...</p>
          </div>
        </Route>
        <Route path="/crm/reports">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports</h1>
            <p className="text-gray-600">Reports and analytics coming soon...</p>
          </div>
        </Route>
        <Route path="/crm/settings">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600">Settings page coming soon...</p>
          </div>
        </Route>
        <Route>
          <Dashboard 
            customer={currentUser.type === "customer" ? currentUser.data : null}
            user={currentUser.type === "user" ? currentUser.data : null}
            userType={currentUser.type}
          />
        </Route>
      </Switch>
    </DashboardLayout>
  );
}