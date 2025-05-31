import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subjects enum
export const subjects = [
  "arabic",
  "english",
  "math",
  "chemistry",
  "physics",
  "biology",
  "constitution",
  "islamic",
] as const;

export const semesters = ["first", "second"] as const;

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject", { enum: subjects }).notNull(),
  semester: text("semester", { enum: semesters }).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Exam weeks table
export const examWeeks = pgTable("exam_weeks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull(),
  day: text("day").notNull(),
  subject: text("subject", { enum: subjects }).notNull(),
  date: text("date").notNull(),
  topics: text("topics").array().notNull(),
});

// Quiz table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject", { enum: subjects }).notNull(),
  creator: text("creator").notNull(),
  description: text("description"),
  code: text("code").notNull().unique(),
  questions: json("questions").notNull(),
  randomizeQuestions: boolean("randomize_questions").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz attempt table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  name: text("name").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  answers: json("answers").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin credentials
export const adminUsername = "mohamed_admen_mo2025";
export const adminPassword = "mohamed_admen_mo2025#";

// Schema validation
export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploadedAt: true });
export const insertExamWeekSchema = createInsertSchema(examWeeks).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, code: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, createdAt: true });

// Quiz question schema
export const questionSchema = z.object({
  question: z.string(),
  type: z.enum(['multiple', 'truefalse', 'essay']),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  acceptedAnswers: z.array(z.string()).optional(),
});

export type Question = z.infer<typeof questionSchema>;
export type Questions = Question[];

// Types
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type ExamWeek = typeof examWeeks.$inferSelect;
export type InsertExamWeek = z.infer<typeof insertExamWeekSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// For backward compatibility with client code
export type FileData = File;
