import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Files from "@/pages/Files";
import Exams from "@/pages/Exams";
import Quizzes from "@/pages/Quizzes";
import TakeQuiz from "@/pages/TakeQuiz";
import QuizResults from "@/pages/QuizResults";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Analytics from './pages/Analytics';
import StudySchedule from './pages/StudySchedule';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Files} />
      <Route path="/files" component={Files} />
      <Route path="/exams" component={Exams} />
      <Route path="/quizzes" component={Quizzes} />
      <Route path="/quiz/:id" component={TakeQuiz} />
      <Route path="/quiz-results/:id" component={QuizResults} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/study-schedule" component={StudySchedule} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Layout>
              <Router />
            </Layout>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;