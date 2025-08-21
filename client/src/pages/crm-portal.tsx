import { useState } from "react";
import CRMLogin from "./crm-login";
import CRMAdminDashboard from "./crm-admin-dashboard";
import CRMUserDashboard from "./crm-user-dashboard";
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

  if (currentUser.type === "customer") {
    return (
      <CRMAdminDashboard
        customer={currentUser.data as Customer}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CRMUserDashboard
      user={currentUser.data as CustomerUser}
      onLogout={handleLogout}
    />
  );
}