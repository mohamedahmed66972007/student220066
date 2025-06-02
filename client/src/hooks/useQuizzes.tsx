import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Quiz, InsertQuiz, QuizAttempt, Question } from "@shared/schema";

interface CreateQuizData extends Omit<InsertQuiz, "code"> {
  questions: Question[];
}

export const useQuizzes = (quizId?: number) => {
  const [searchResults, setSearchResults] = useState<Quiz[]>([]);

  // Fetch all quizzes
  const {
    data: quizzes,
    isLoading,
    error,
    refetch,
  } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    enabled: !quizId,
  });

  // Fetch single quiz if quizId is provided
  const {
    data: quiz,
    isLoading: isLoadingQuiz,
    error: quizError,
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  // Fetch quiz attempts for a quiz
  const {
    data: attempts,
    isLoading: isLoadingAttempts,
    error: attemptsError,
  } = useQuery<QuizAttempt[]>({
    queryKey: [`/api/quiz-attempts/${quizId}`],
    enabled: !!quizId,
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (data: CreateQuizData): Promise<Quiz> => {
      const response = await apiRequest("POST", "/api/quizzes", data);
      const quiz = await response.json();
      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
  });

  // Submit quiz attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async (data: {
      quizId: number;
      name: string;
      answers: number[];
      score: number;
      maxScore: number;
    }): Promise<QuizAttempt> => {
      const response = await apiRequest("POST", "/api/quiz-attempts", {
        quizId: data.quizId,
        name: data.name,
        score: data.score,
        maxScore: data.maxScore,
        answers: data.answers,
      });
      const attempt = await response.json();
      return attempt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quiz-attempts/${variables.quizId}`] });
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quizzes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
  });

  // Search quiz by code
  const searchQuizByCode = async (code: string) => {
    try {
      const response = await fetch(`/api/quizzes/code/${code}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setSearchResults([]);
          return null;
        }
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const quiz = await response.json();
      setSearchResults([quiz]);
      return quiz;
    } catch (error) {
      console.error("Error searching quiz:", error);
      setSearchResults([]);
      return null;
    }
  };

  return {
    quizzes: searchResults.length > 0 ? searchResults : (quizzes || []),
    quiz,
    attempts: attempts || [],
    isLoading,
    isLoadingQuiz,
    isLoadingAttempts,
    error,
    quizError,
    attemptsError,
    isCreating: createQuizMutation.isPending,
    isSubmitting: submitAttemptMutation.isPending,
    createQuiz: createQuizMutation.mutateAsync,
    submitAttempt: submitAttemptMutation.mutateAsync,
    deleteQuiz: deleteQuizMutation.mutateAsync,
    searchQuizByCode,
    refetch,
  };
};
