import React, { useState, useEffect } from "react";
import { useQuizzes } from "@/hooks/useQuizzes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Questions, Question } from "@shared/schema";
import { subjectOptions } from "./SubjectIcons";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyQuestion: Question = {
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  type: "multiple"
};

const emptyTrueFalseQuestion: Question = {
  question: "",
  options: ["صح", "خطأ"],
  correctAnswer: 0,
  type: "truefalse"
};

const emptyEssayQuestion: Question = {
  question: "",
  options: [],
  correctAnswer: 0,
  type: "essay",
  acceptedAnswers: [""]
};

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  type: "multiple" | "truefalse" | "essay";
  acceptedAnswers?: string[];
  image?: string;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const { userName } = useAuth();
  const [creator, setCreator] = useState(userName || "");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Questions>([{ ...emptyQuestion }]);
  const [quizCode, setQuizCode] = useState("");
  const randomizeQuestions = true; // Always randomize questions

  const { createQuiz, isCreating } = useQuizzes();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.displayName) {
      setCreator(user.displayName);
    }
  }, [user]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title || !subject || !creator) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 2) {
      const isValid = questions.every(
        (q) => 
          q.question.trim() !== "" && 
          (q.type === "essay" || q.options.every(opt => opt.trim() !== ""))
      );

      if (!isValid) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الأسئلة والخيارات",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeQuestion = (index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, question: value } : q))
    );
  };

  const handleChangeOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, j) =>
                j === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const handleChangeCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex ? { ...q, correctAnswer: optionIndex } : q
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const result = await createQuiz({
        title,
        subject,
        creator,
        description,
        questions,
        randomizeQuestions
      });

      if (result) {
        setQuizCode(result.code);
        toast({
          title: "تم إنشاء الاختبار بنجاح",
          description: `رمز الاختبار: ${result.code}`,
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الاختبار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    // Reset form
    setCurrentStep(1);
    setTitle("");
    setSubject("");
    setCreator(userName || "");
    setDescription("");
    setQuestions([{ ...emptyQuestion }]);
    setQuizCode("");
    onClose();
  };

  // تحديث اسم المنشئ عند تغيير userName
  useEffect(() => {
    if (userName) {
      setCreator(userName);
    }
  }, [userName]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">إنشاء اختبار جديد</DialogTitle>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 mb-6">
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600"></div>
            <div className={`px-4 flex items-center justify-center ${
              currentStep === 1 ? "text-primary" : "text-gray-400"
            }`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                currentStep === 1 ? "border-primary bg-primary text-white" : "border-gray-400"
              }`}>1</div>
              <span className="mr-2">معلومات الاختبار</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600"></div>
            <div className={`px-4 flex items-center justify-center ${
              currentStep === 2 ? "text-primary" : "text-gray-400"
            }`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                currentStep === 2 ? "border-primary bg-primary text-white" : "border-gray-400"
              }`}>2</div>
              <span className="mr-2">الأسئلة</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600"></div>
            <div className={`px-4 flex items-center justify-center ${
              currentStep === 3 ? "text-primary" : "text-gray-400"
            }`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                currentStep === 3 ? "border-primary bg-primary text-white" : "border-gray-400"
              }`}>3</div>
              <span className="mr-2">المراجعة</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600"></div>
          </div>

          {/* Step 1: Quiz Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الاختبار</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: اختبار الرياضيات - موضوعي"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">المادة</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creator">اسمك</Label>
                <Input
                  id="creator"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="مثال: محمد أحمد"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف الاختبار (اختياري)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="أدخل وصفاً مختصراً للاختبار"
                  rows={3}
                />

              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div>
              {questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <h4 className="font-bold">السؤال {questionIndex + 1}</h4>
                      <Select 
                        value={question.type || "multiple"} 
                        onValueChange={(value) => {
                          setQuestions(prev =>
                            prev.map((q, i) =>
                              i === questionIndex
                                ? value === "truefalse"
                                  ? { ...emptyTrueFalseQuestion, question: q.question }
                                  : value === "essay"
                                    ? { ...emptyEssayQuestion, question: q.question }
                                    : { ...emptyQuestion, question: q.question }
                                : q
                            )
                          );
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="نوع السؤال" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple">اختيار متعدد</SelectItem>
                          <SelectItem value="truefalse">صح وخطأ</SelectItem>
                          <SelectItem value="essay">سؤال مقالي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveQuestion(questionIndex)}
                      disabled={questions.length <= 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor={`question-${questionIndex}`}>نص السؤال</Label>
                    <div className="space-y-2">
                      <Input
                        id={`question-${questionIndex}`}
                        value={question.question}
                        onChange={(e) => handleChangeQuestion(questionIndex, e.target.value)}
                        placeholder="أدخل نص السؤال"
                        className="mt-1"
                        required
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) { // 5MB limit
                                toast({
                                  title: "خطأ",
                                  description: "حجم الصورة كبير جداً. يجب أن يكون أقل من 5 ميجابايت",
                                  variant: "destructive",
                                });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const image = e.target?.result as string;
                                setQuestions(prev =>
                                  prev.map((q, i) =>
                                    i === questionIndex
                                      ? { ...q, image }
                                      : q
                                  )
                                );
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full"
                        />
                        {question.image && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setQuestions(prev =>
                                prev.map((q, i) =>
                                  i === questionIndex
                                    ? { ...q, image: undefined }
                                    : q
                                )
                              );
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {question.image && (
                        <div className="mt-2">
                          <img
                            src={question.image}
                            alt="صورة السؤال"
                            className="max-h-32 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {question.type !== 'essay' ? (
                    <div className="mb-4">
                      <Label>الخيارات</Label>
                      <RadioGroup
                        value={question.correctAnswer.toString()}
                        onValueChange={(value) => handleChangeCorrectAnswer(questionIndex, parseInt(value))}
                        className="mt-2 space-y-2"
                      >
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem
                              value={optionIndex.toString()}
                              id={`question-${questionIndex}-option-${optionIndex}`}
                            />
                            <Input
                              value={option}
                              onChange={(e) => handleChangeOption(questionIndex, optionIndex, e.target.value)}
                              placeholder={`الخيار ${optionIndex + 1}`}
                              className="flex-1"
                              required
                            />
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ) : null}

                  {question.type === 'essay' && (
                    <div className="mt-4">
                      <Label>الإجابات المقبولة</Label>
                      <div className="space-y-2">
                        {question.acceptedAnswers?.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex gap-2">
                            <Input
                              value={answer}
                              onChange={(e) => {
                                const newAnswers = [...(question.acceptedAnswers || [])];
                                newAnswers[answerIndex] = e.target.value;
                                setQuestions(prev =>
                                  prev.map((q, i) =>
                                    i === questionIndex
                                      ? { ...q, acceptedAnswers: newAnswers }
                                      : q
                                  )
                                );
                              }}
                              placeholder={`الإجابة ${answerIndex + 1}`}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const newAnswers = question.acceptedAnswers?.filter((_, i) => i !== answerIndex);
                                setQuestions(prev =>
                                  prev.map((q, i) =>
                                    i === questionIndex
                                      ? { ...q, acceptedAnswers: newAnswers }
                                      : q
                                  )
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newAnswers = [...(question.acceptedAnswers || []), ""];
                            setQuestions(prev =>
                              prev.map((q, i) =>
                                i === questionIndex
                                  ? { ...q, acceptedAnswers: newAnswers }
                                  : q
                              )
                            );
                          }}
                        >
                          إضافة إجابة جديدة
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="secondary"
                onClick={handleAddQuestion}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-5 w-5 ml-2" />
                <span className="text-lg">إضافة سؤال جديد</span>
              </Button>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h4 className="font-bold text-lg mb-4">ملخص الاختبار</h4>

              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 mb-1">العنوان: <span className="font-bold">{title}</span></p>
                <p className="text-gray-700 dark:text-gray-300 mb-1">المادة: <span className="font-bold">
                  {subjectOptions.find(opt => opt.value === subject)?.label || subject}
                </span></p>
                <p className="text-gray-700 dark:text-gray-300 mb-1">المنشئ: <span className="font-bold">{creator}</span></p>
                <p className="text-gray-700 dark:text-gray-300 mb-1">عدد الأسئلة: <span className="font-bold">{questions.length}</span></p>
              </div>

              {quizCode && (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">رمز الاختبار:</p>
                  <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 flex items-center justify-between">
                    <span className="font-mono font-bold">{quizCode}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        navigator.clipboard.writeText(quizCode);
                        toast({
                          title: "تم نسخ الرمز",
                          description: "تم نسخ رمز الاختبار إلى الحافظة",
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">شارك هذا الرمز مع الطلاب للوصول إلى الاختبار</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <ArrowRight className="h-4 w-4 ml-1" />
              <span>السابق</span>
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <span>التالي</span>
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={quizCode ? handleClose : handleSubmit}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <span className="animate-spin ml-2">◌</span>
                  جاري الإنشاء...
                </>
              ) : quizCode ? (
                "إغلاق"
              ) : (
                "إنشاء الاختبار"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizModal;