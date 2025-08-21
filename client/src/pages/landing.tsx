import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <Card className="bg-white rounded-2xl shadow-xl">
          <CardContent className="p-8">
            {/* Login Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-xl mb-4">
                <Truck className="text-white text-2xl" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900 mb-2">Server Panel</h1>
              <p className="text-secondary-600">Vehicle Brokerage CRM Administration</p>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              className="w-full py-3 text-sm font-medium bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign in with Replit Auth
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-secondary-500 flex items-center justify-center">
            <Shield className="mr-1" size={12} />
            Secure authentication powered by Replit Auth
          </p>
        </div>
      </div>
    </div>
  );
}
