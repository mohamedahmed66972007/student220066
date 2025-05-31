
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AdminLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  message?: string;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  message = "يجب تسجيل الدخول للوصول إلى هذه الميزة" 
}) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <CardTitle className="text-lg">تسجيل الدخول مطلوب</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <Button onClick={() => setShowAuthModal(true)} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
