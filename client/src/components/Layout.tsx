import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import AuthModal from "@/components/AdminLogin";
import AdminWelcome from "@/components/AdminWelcome";
import AccountModal from "@/components/AccountModal";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Sun, 
  Moon, 
  FileText, 
  Calendar, 
  HelpCircle, 
  Shield,
  BarChart3,
  BookOpen,
  User, MessageCircle, BarChart3 as BarChart3Icon
} from "lucide-react";
import Footer from "./Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NavIcons } from "./SubjectIcons";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, isAdmin, userName, adminNumber, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminWelcome, setShowAdminWelcome] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // عرض ترحيب المشرف عند تسجيل الدخول لأول مرة
  useEffect(() => {
    if (isAdmin && !userName) {
      setShowAdminWelcome(true);
    }
  }, [isAdmin, userName]);

  const getCurrentSection = (): string => {
    if (location.startsWith("/analytics")) return "analytics";
    if (location === "/" || location.startsWith("/files")) return "files";
    if (location.startsWith("/study-schedule")) return "study-schedule";
    if (location.startsWith("/exams")) return "exams";
    if (location.startsWith("/quizzes") || location.startsWith("/quiz")) return "quizzes";
    return "files";
  };

  const currentSection = getCurrentSection();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-primary-foreground">دفعة 2026</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/analytics">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="التحليلات"
                  className="rounded-full"
                >
                  <BarChart3Icon className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAccountModal(true)}
                className="flex items-center space-x-1 space-x-reverse"
              >
                <User className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">حسابي</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-1 space-x-reverse"
              >
                <Shield className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mb-16">
            {children}
          </div>
        </main>

        {/* Contact Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              className="fixed bottom-20 left-4 z-50 rounded-full h-12 w-12 shadow-lg"
              title="تواصل معنا"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-3" side="top" align="start">
            <div className="space-y-3">
              <h3 className="font-semibold text-center">تواصل معنا</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => window.open('https://wa.me/+96566162173', '_blank')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.390-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/>
                  </svg>
                  واتساب
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => window.open('mailto:mohamed66162173@gmail.com', '_blank')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  البريد الإلكتروني
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => window.open('https://tiktok.com/@mo2025_editor', '_blank')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  تيك توك
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Bottom Navigation (visible on all screen sizes) */}
        <nav className="fixed bottom-0 right-0 left-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 py-2">
          <div className="flex justify-around items-center">
            <Link href="/files" className={`flex flex-col items-center p-2 ${
              currentSection === "files" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.files className="text-lg" />
              <span className="text-xs mt-1">الملفات</span>
            </Link>
            <Link href="/study-schedule" className={`flex flex-col items-center p-2 ${
              currentSection === "study-schedule" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><rect width="6" height="6" x="9" y="12" rx="1"/></svg>
              <span className="text-xs mt-1">جدول المذاكرة</span>
            </Link>
            <Link href="/exams" className={`flex flex-col items-center p-2 ${
              currentSection === "exams" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.exams className="text-lg" />
              <span className="text-xs mt-1">جدول الاختبارات</span>
            </Link>
            <Link href="/quizzes" className={`flex flex-col items-center p-2 ${
              currentSection === "quizzes" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.quizzes className="text-lg" />
              <span className="text-xs mt-1">الاختبارات الاكترونية</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Footer - Hide on mobile */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Admin Login Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Admin Welcome Modal */}
      <AdminWelcome
        isOpen={showAdminWelcome}
        onClose={() => setShowAdminWelcome(false)}
      />

      {/* Account Modal */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
};

export default Layout;