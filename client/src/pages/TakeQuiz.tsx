import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuizzes } from "@/hooks/useQuizzes";
import { Questions } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import {
  getSubjectName,
  getSubjectLightColor,
} from "@/components/SubjectIcons";
import { useToast } from "@/hooks/use-toast";

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { quiz, isLoadingQuiz, quizError, submitAttempt, isSubmitting } =
    useQuizzes(parseInt(id));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[] | string[]>(
    [],
  );
  const [guestName, setGuestName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  // Initialize selected answers array
  const [randomizedQuestions, setRandomizedQuestions] = useState<Questions>([]);

  useEffect(() => {
    if (quiz && Array.isArray(quiz.questions)) {
      const questions = quiz.questions as Questions;
      // Randomize questions and their options
      const shuffled = questions.map((question) => {
        if (question.type === "multiple") {
          // Create pairs of options and their correct index
          const optionPairs = question.options.map((opt, idx) => ({
            option: opt,
            isCorrect: idx === question.correctAnswer,
          }));

          // Shuffle the pairs
          for (let i = optionPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionPairs[i], optionPairs[j]] = [optionPairs[j], optionPairs[i]];
          }

          // Update question with shuffled options and new correct answer index
          return {
            ...question,
            options: optionPairs.map((pair) => pair.option),
            correctAnswer: optionPairs.findIndex((pair) => pair.isCorrect),
          };
        }
        return question;
      });

      // Shuffle questions order
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setRandomizedQuestions(shuffled);

      if (!selectedAnswers.length) {
        setSelectedAnswers(new Array(questions.length).fill(-1));
      }
    }
  }, [quiz, selectedAnswers.length]);

  const questions = randomizedQuestions;
  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (questions?.length || 0) - 1;

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate score before finishing
      calculateScore();
      setIsFinished(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSelectAnswer = (value: string | number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = value;
    setSelectedAnswers(newAnswers);
  };

  const normalizeText = (text: string): string => {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        // تطبيع الهمزات
        .replace(/[أإآ]/g, "ا")
        .replace(/[ؤ]/g, "و")
        .replace(/[ئ]/g, "ي")
        // تطبيع التاء المربوطة والهاء
        .replace(/[ة]/g, "ه")
        // إزالة التشكيل
        .replace(/[\u064B-\u0652]/g, "")
    );
  };

  const removeDefiniteArticle = (text: string): string => {
    // إزالة "ال" التعريف من بداية الكلمة
    return text.replace(/^ال/, "");
  };

  const generateGenderVariations = (text: string): string[] => {
    const variations = [text];

    // إضافة نسخة بدون التاء المربوطة أو الهاء في نهاية الكلمة
    if (text.endsWith("ة") || text.endsWith("ه")) {
      variations.push(text.slice(0, -1));
    } else {
      // إضافة نسخة مع التاء المربوطة والهاء
      variations.push(text + "ة");
      variations.push(text + "ه");
    }

    return variations;
  };

  const checkAnswerMatch = (
    userAnswer: string,
    acceptedAnswers: string[],
  ): boolean => {
    const normalizedUserAnswer = normalizeText(userAnswer);
    const userAnswerWithoutAl = removeDefiniteArticle(normalizedUserAnswer);
    const userGenderVariations = generateGenderVariations(normalizedUserAnswer);
    const userGenderVariationsWithoutAl = userGenderVariations.map(
      (variation) => removeDefiniteArticle(variation),
    );

    return acceptedAnswers.some((acceptedAnswer) => {
      const normalizedAccepted = normalizeText(acceptedAnswer);
      const acceptedWithoutAl = removeDefiniteArticle(normalizedAccepted);
      const acceptedGenderVariations =
        generateGenderVariations(normalizedAccepted);
      const acceptedGenderVariationsWithoutAl = acceptedGenderVariations.map(
        (variation) => removeDefiniteArticle(variation),
      );

      // تحقق من التطابق المباشر
      if (normalizedAccepted === normalizedUserAnswer) {
        return true;
      }

      // تحقق من التطابق بدون "ال" التعريف
      if (acceptedWithoutAl === userAnswerWithoutAl) {
        return true;
      }

      // تحقق من التطابق مع اختلافات المذكر والمؤنث
      if (
        userGenderVariations.some(
          (userVar) =>
            acceptedGenderVariations.includes(userVar) ||
            acceptedGenderVariationsWithoutAl.includes(
              removeDefiniteArticle(userVar),
            ),
        )
      ) {
        return true;
      }

      if (
        acceptedGenderVariations.some(
          (acceptedVar) =>
            userGenderVariations.includes(acceptedVar) ||
            userGenderVariationsWithoutAl.includes(
              removeDefiniteArticle(acceptedVar),
            ),
        )
      ) {
        return true;
      }

      // إذا كانت الإجابة المقبولة تحتوي على فاصل، تحقق من كل جزء
      const parts = acceptedAnswer.split(/[\/\\]/).map((part) => part.trim());
      return parts.some((part) => {
        const normalizedPart = normalizeText(part);
        const partWithoutAl = removeDefiniteArticle(normalizedPart);
        const partGenderVariations = generateGenderVariations(normalizedPart);
        const partGenderVariationsWithoutAl = partGenderVariations.map(
          (variation) => removeDefiniteArticle(variation),
        );

        return (
          normalizedPart === normalizedUserAnswer ||
          partWithoutAl === userAnswerWithoutAl ||
          normalizedPart === userAnswerWithoutAl ||
          partWithoutAl === normalizedUserAnswer ||
          userGenderVariations.some(
            (userVar) =>
              partGenderVariations.includes(userVar) ||
              partGenderVariationsWithoutAl.includes(
                removeDefiniteArticle(userVar),
              ),
          ) ||
          partGenderVariations.some(
            (partVar) =>
              userGenderVariations.includes(partVar) ||
              userGenderVariationsWithoutAl.includes(
                removeDefiniteArticle(partVar),
              ),
          )
        );
      });
    });
  };

  const calculateScore = () => {
    if (!questions) return 0;

    let correctCount = 0;

    questions.forEach((question, index) => {
      if (question.type === "essay") {
        const userAnswer = normalizeText(
          selectedAnswers[index]?.toString() || "",
        );
        const acceptedAnswers =
          question.acceptedAnswers?.map((answer) => normalizeText(answer)) ||
          [];

        // التحقق من تطابق الإجابة مع أي من الإجابات المقبولة
        const isCorrect = acceptedAnswers.some((acceptedAnswer) => {
          // مقارنة مباشرة بعد التطبيع
          if (userAnswer === acceptedAnswer) return true;

          // مقارنة إضافية للكلمات العربية
          const userWords = userAnswer.split(" ").filter((w) => w.length > 0);
          const acceptedWords = acceptedAnswer
            .split(" ")
            .filter((w) => w.length > 0);

          if (userWords.length === acceptedWords.length) {
            return userWords.every((userWord, idx) => {
              const acceptedWord = acceptedWords[idx];
              // مقارنة مباشرة أو بعد إزالة أحرف الجمع
              return (
                userWord === acceptedWord ||
                userWord.replace(/ات$|ون$|ين$|ان$/, "") ===
                  acceptedWord.replace(/ات$|ون$|ين$|ان$/, "")
              );
            });
          }

          return false;
        });

        if (isCorrect) {
          correctCount++;
        }
      } else if (question.correctAnswer === selectedAnswers[index]) {
        correctCount++;
      }
    });

    setScore(correctCount);
    return correctCount;
  };

  const handleStart = () => {
    if (!userName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسمك قبل بدء الاختبار",
        variant: "destructive",
      });
      return;
    }

    // Save name for later use in other quizzes
    localStorage.setItem("quizUserName", userName);

    setIsStarted(true);
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    try {
      await submitAttempt({
        quizId: quiz.id,
        name: userName,
        answers: selectedAnswers,
        score: score,
        maxScore: questions.length,
      });

      toast({
        title: "تم تقديم الاختبار",
        description: `حصلت على ${score} من ${questions.length} نقطة`,
      });

      // Navigate to results page
      navigate(`/quiz-results/${id}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تقديم الاختبار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Load saved user name if exists
  useEffect(() => {
    const savedName = localStorage.getItem("quizUserName");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  if (isLoadingQuiz) {
    return (
      <div className="text-center py-10">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        <p className="mt-4">جاري تحميل الاختبار...</p>
      </div>
    );
  }

  if (quizError || !quiz) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">
          حدث خطأ أثناء تحميل الاختبار أو الاختبار غير موجود.
        </p>
        <Button onClick={() => navigate("/quizzes")} className="mt-4">
          العودة إلى الاختبارات
        </Button>
      </div>
    );
  }

  const subjectName = getSubjectName(quiz.subject as any);
  const subjectClass = getSubjectLightColor(quiz.subject as any);

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <div
              className={`inline-block ${subjectClass} px-3 py-1 rounded-full text-sm`}
            >
              {subjectName}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>المنشئ: {quiz.creator}</p>
            <p>
              عدد الأسئلة:{" "}
              {Array.isArray(quiz.questions) ? quiz.questions.length : 0}
            </p>
            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-300">
                {quiz.description}
              </p>
            )}

            <div className="border-t pt-4 mt-6">
              <Label htmlFor="userName">أدخل اسمك للبدء</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="الاسم الكامل"
                className="mt-2"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleStart}>بدء الاختبار</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">النتيجة النهائية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="text-green-500 h-16 w-16 mb-4" />
              <h3 className="text-2xl font-bold">اكتمل الاختبار!</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                شكراً لإتمامك الاختبار
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-lg mb-2">النتيجة:</p>
              <p className="text-3xl font-bold">
                {score} / {questions.length}
              </p>
              <p className="text-lg mt-2">
                النسبة المئوية: {Math.round((score / questions.length) * 100)}%
              </p>
            </div>

            <div className="space-y-4 mt-6">
              <h4 className="font-bold text-lg text-right">مراجعة الإجابات:</h4>
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    question.type === "essay"
                      ? question.acceptedAnswers?.some(
                          (answer) =>
                            normalizeText(answer) ===
                            normalizeText(
                              selectedAnswers[index]?.toString() || "",
                            ),
                        )
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900"
                      : selectedAnswers[index] === question.correctAnswer
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900"
                  }`}
                >
                  <p className="font-medium mb-2">{question.question}</p>
                  {question.type === "essay" ? (
                    <div className="space-y-2">
                      <p className="p-2 rounded bg-gray-50 dark:bg-gray-800">
                        إجابتك: {selectedAnswers[index]}
                      </p>
                      <p className="p-2 rounded bg-green-50 dark:bg-green-900/20">
                        الإجابة الصحيحة:{" "}
                        {question.acceptedAnswers?.find(
                          (answer) =>
                            normalizeText(answer) ===
                            normalizeText(
                              selectedAnswers[index]?.toString() || "",
                            ),
                        ) || question.acceptedAnswers?.[0]}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <p
                          key={optionIndex}
                          className={`p-2 rounded ${
                            optionIndex === question.correctAnswer
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                              : optionIndex === selectedAnswers[index]
                                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                : ""
                          }`}
                        >
                          {option}
                          {optionIndex === question.correctAnswer && " ✓"}
                          {optionIndex === selectedAnswers[index] &&
                            optionIndex !== question.correctAnswer &&
                            " ✗"}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin ml-2">◌</span>
                  جاري الحفظ...
                </>
              ) : (
                "حفظ النتيجة"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{quiz.title}</CardTitle>
            <div className="text-sm font-medium">
              السؤال {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">
              {currentQuestion?.question}
            </h3>
            {currentQuestion?.image && (
              <div
                className="mb-4 cursor-zoom-in"
                onClick={() => {
                  const modal = document.createElement("div");
                  modal.className =
                    "fixed inset-0 bg-black/80 flex items-center justify-center z-50";
                  modal.onclick = () => modal.remove();
                  const img = document.createElement("img");
                  img.src = currentQuestion.image!;
                  img.className = "max-w-[90vw] max-h-[90vh] object-contain";
                  modal.appendChild(img);
                  document.body.appendChild(modal);
                }}
              >
                <img
                  src={currentQuestion.image}
                  alt="صورة السؤال"
                  className="max-h-64 mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            {currentQuestion?.type === "essay" ? (
              <Input
                value={
                  selectedAnswers[currentQuestionIndex] === -1
                    ? ""
                    : selectedAnswers[currentQuestionIndex]?.toString() || ""
                }
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا"
                className="mt-4"
              />
            ) : (
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex]?.toString()}
                onValueChange={(value) => handleSelectAnswer(parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion?.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer py-2"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-1 space-x-reverse"
          >
            <ArrowRight className="h-4 w-4 ml-1" />
            <span>السابق</span>
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswers[currentQuestionIndex] === -1}
            className="flex items-center space-x-1 space-x-reverse"
          >
            <span>{isLastQuestion ? "إنهاء الاختبار" : "التالي"}</span>
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TakeQuiz;
