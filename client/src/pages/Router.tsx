
import { Route, Switch } from "wouter";
import Files from "./Files";
import Exams from "./Exams";
import Quizzes from "./Quizzes";
import TakeQuiz from "./TakeQuiz";
import QuizResults from "./QuizResults";
import StudySchedule from "./StudySchedule";
import Analytics from "./Analytics";
import NotFound from "./not-found";

const Router = () => {
  return (
    <Switch>
      <Route path="/" component={Files} />
      <Route path="/files" component={Files} />
      <Route path="/exams" component={Exams} />
      <Route path="/quizzes" component={Quizzes} />
      <Route path="/quiz/:id" component={TakeQuiz} />
      <Route path="/quiz-results/:id" component={QuizResults} />
      <Route path="/schedule" component={StudySchedule} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
};

export default Router;
