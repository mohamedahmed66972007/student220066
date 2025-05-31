
import { 
  File,
  InsertFile,
  ExamWeek,
  InsertExamWeek,
  Exam,
  InsertExam,
  Quiz,
  InsertQuiz,
  QuizAttempt,
  InsertQuizAttempt,
  Questions,
  subjects,
  semesters,
  adminUsername,
  adminPassword
} from "@shared/schema";
import { nanoid } from "nanoid";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dgmis4xye',
  api_key: '621754129496215',
  api_secret: 'wQXuDRX6Ro8YEonIlxyJs9hVR5s'
});

export interface IStorage {
  // Auth
  validateAdmin(username: string, password: string): Promise<boolean>;
  
  // Files
  getFiles(): Promise<File[]>;
  getFilesBySubject(subject: string): Promise<File[]>;
  getFilesBySemester(semester: string): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile, fileBuffer: Buffer): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Exam Weeks
  getExamWeeks(): Promise<ExamWeek[]>;
  getExamWeek(id: number): Promise<ExamWeek | undefined>;
  createExamWeek(examWeek: InsertExamWeek): Promise<ExamWeek>;
  deleteExamWeek(id: number): Promise<boolean>;
  
  // Exams
  getExams(): Promise<Exam[]>;
  getExamsByWeek(weekId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  deleteExam(id: number): Promise<boolean>;
  
  // Quizzes
  getQuizzes(): Promise<Quiz[]>;
  getQuizByCode(code: string): Promise<Quiz | undefined>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Quiz Attempts
  getQuizAttempts(quizId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
}

export class LocalStorage implements IStorage {
  private currentFileId: number;
  private currentExamWeekId: number;
  private currentExamId: number;
  private currentQuizId: number;
  private currentQuizAttemptId: number;
  private dataDir: string;
  
  constructor() {
    this.currentFileId = 1;
    this.currentExamWeekId = 1;
    this.currentExamId = 1;
    this.currentQuizId = 1;
    this.currentQuizAttemptId = 1;
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDirectory();
    this.loadCounters();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadCounters() {
    try {
      const countersPath = path.join(this.dataDir, 'counters.json');
      if (fs.existsSync(countersPath)) {
        const counters = JSON.parse(fs.readFileSync(countersPath, 'utf8'));
        this.currentFileId = counters.fileId || 1;
        this.currentExamWeekId = counters.examWeekId || 1;
        this.currentExamId = counters.examId || 1;
        this.currentQuizId = counters.quizId || 1;
        this.currentQuizAttemptId = counters.quizAttemptId || 1;
      }
    } catch (error) {
      console.log('Could not load counters, starting fresh');
    }
  }

  private saveCounters() {
    try {
      const counters = {
        fileId: this.currentFileId,
        examWeekId: this.currentExamWeekId,
        examId: this.currentExamId,
        quizId: this.currentQuizId,
        quizAttemptId: this.currentQuizAttemptId
      };
      fs.writeFileSync(path.join(this.dataDir, 'counters.json'), JSON.stringify(counters));
    } catch (error) {
      console.error('Error saving counters:', error);
    }
  }

  private readDataFile<T>(filename: string): T[] {
    try {
      const filePath = path.join(this.dataDir, filename);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  private writeDataFile<T>(filename: string, data: T[]) {
    try {
      fs.writeFileSync(path.join(this.dataDir, filename), JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }
  
  // Auth
  async validateAdmin(username: string, password: string): Promise<boolean> {
    return username === adminUsername && password === adminPassword;
  }
  
  // Files
  async getFiles(): Promise<File[]> {
    return this.readDataFile<File>('files.json');
  }
  
  async getFilesBySubject(subject: string): Promise<File[]> {
    const files = await this.getFiles();
    return files.filter(file => file.subject === subject);
  }
  
  async getFilesBySemester(semester: string): Promise<File[]> {
    const files = await this.getFiles();
    return files.filter(file => file.semester === semester);
  }
  
  async getFile(id: number): Promise<File | undefined> {
    const files = await this.getFiles();
    return files.find(file => file.id === id);
  }
  
  async createFile(fileData: InsertFile, fileBuffer: Buffer): Promise<File> {
    try {
      console.log('Starting file upload to Cloudinary:', {
        fileName: fileData.fileName,
        bufferSize: fileBuffer.length,
        fileType: fileData.fileName.split('.').pop()
      });

      // Validate file buffer
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      // Upload to Cloudinary with better configuration
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "student-portal",
            public_id: `${Date.now()}-${fileData.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
            timeout: 120000, // Increase timeout to 2 minutes
            use_filename: true,
            unique_filename: true,
            access_mode: "public", // Ensure public access
            type: "upload", // Ensure proper type
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Cloudinary upload failed: ${error.message}`));
            } else if (!result) {
              reject(new Error('Cloudinary upload returned no result'));
            } else {
              console.log('Cloudinary upload success:', {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format
              });
              resolve(result);
            }
          }
        );

        uploadStream.end(fileBuffer);
      }) as any;

      // Validate upload result
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error('Invalid upload result from Cloudinary');
      }

      const id = this.currentFileId++;
      const file: File = {
        id,
        ...fileData,
        filePath: uploadResult.secure_url,
        uploadedAt: new Date(),
      };
      
      console.log('Saving file to local storage:', { 
        id, 
        fileName: fileData.fileName,
        filePath: file.filePath 
      });
      
      // Save to local storage
      const files = await this.getFiles();
      files.push(file);
      this.writeDataFile('files.json', files);
      this.saveCounters();
      
      console.log('File saved successfully with URL:', file.filePath);
      return file;
    } catch (error) {
      console.error('Error in createFile:', error);
      throw new Error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async deleteFile(id: number): Promise<boolean> {
    try {
      const files = await this.getFiles();
      const fileIndex = files.findIndex(file => file.id === id);
      
      if (fileIndex === -1) return false;
      
      const file = files[fileIndex];
      
      // Extract public_id from Cloudinary URL and delete from Cloudinary
      if (file.filePath) {
        try {
          const publicId = file.filePath.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting from Cloudinary:', error);
        }
      }
      
      // Remove from local storage
      files.splice(fileIndex, 1);
      this.writeDataFile('files.json', files);
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  // Exam Weeks
  async getExamWeeks(): Promise<ExamWeek[]> {
    return this.readDataFile<ExamWeek>('examWeeks.json');
  }
  
  async getExamWeek(id: number): Promise<ExamWeek | undefined> {
    const examWeeks = await this.getExamWeeks();
    return examWeeks.find(week => week.id === id);
  }
  
  async createExamWeek(examWeekData: InsertExamWeek): Promise<ExamWeek> {
    try {
      const id = this.currentExamWeekId++;
      const examWeek: ExamWeek = {
        id,
        ...examWeekData,
        createdAt: new Date(),
      };
      
      const examWeeks = await this.getExamWeeks();
      examWeeks.push(examWeek);
      this.writeDataFile('examWeeks.json', examWeeks);
      this.saveCounters();
      
      return examWeek;
    } catch (error) {
      console.error('Error creating exam week:', error);
      throw error;
    }
  }
  
  async deleteExamWeek(id: number): Promise<boolean> {
    try {
      const examWeeks = await this.getExamWeeks();
      const weekIndex = examWeeks.findIndex(week => week.id === id);
      
      if (weekIndex === -1) return false;
      
      // Delete associated exams
      const exams = await this.getExams();
      const updatedExams = exams.filter(exam => exam.weekId !== id);
      this.writeDataFile('exams.json', updatedExams);
      
      // Delete exam week
      examWeeks.splice(weekIndex, 1);
      this.writeDataFile('examWeeks.json', examWeeks);
      
      return true;
    } catch (error) {
      console.error('Error deleting exam week:', error);
      return false;
    }
  }
  
  // Exams
  async getExams(): Promise<Exam[]> {
    return this.readDataFile<Exam>('exams.json');
  }
  
  async getExamsByWeek(weekId: number): Promise<Exam[]> {
    const exams = await this.getExams();
    return exams.filter(exam => exam.weekId === weekId);
  }
  
  async createExam(examData: InsertExam): Promise<Exam> {
    try {
      const id = this.currentExamId++;
      const exam: Exam = {
        id,
        ...examData,
      };
      
      const exams = await this.getExams();
      exams.push(exam);
      this.writeDataFile('exams.json', exams);
      this.saveCounters();
      
      return exam;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  }
  
  async deleteExam(id: number): Promise<boolean> {
    try {
      const exams = await this.getExams();
      const examIndex = exams.findIndex(exam => exam.id === id);
      
      if (examIndex === -1) return false;
      
      exams.splice(examIndex, 1);
      this.writeDataFile('exams.json', exams);
      
      return true;
    } catch (error) {
      console.error('Error deleting exam:', error);
      return false;
    }
  }
  
  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    return this.readDataFile<Quiz>('quizzes.json');
  }
  
  async getQuizByCode(code: string): Promise<Quiz | undefined> {
    const quizzes = await this.getQuizzes();
    return quizzes.find(quiz => quiz.code === code);
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const quizzes = await this.getQuizzes();
    return quizzes.find(quiz => quiz.id === id);
  }
  
  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    try {
      const id = this.currentQuizId++;
      const code = nanoid(8).toUpperCase();
      
      const quiz: Quiz = {
        id,
        title: quizData.title,
        subject: quizData.subject,
        creator: quizData.creator,
        description: quizData.description || null,
        questions: quizData.questions,
        code,
        createdAt: new Date(),
      };
      
      const quizzes = await this.getQuizzes();
      quizzes.push(quiz);
      this.writeDataFile('quizzes.json', quizzes);
      this.saveCounters();
      
      return quiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    try {
      const quizzes = await this.getQuizzes();
      const quizIndex = quizzes.findIndex(quiz => quiz.id === id);
      
      if (quizIndex === -1) return false;
      
      // Delete associated attempts
      const attempts = await this.getQuizAttempts(id);
      const allAttempts = this.readDataFile<QuizAttempt>('quizAttempts.json');
      const updatedAttempts = allAttempts.filter(attempt => attempt.quizId !== id);
      this.writeDataFile('quizAttempts.json', updatedAttempts);
      
      // Delete quiz
      quizzes.splice(quizIndex, 1);
      this.writeDataFile('quizzes.json', quizzes);
      
      return true;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      return false;
    }
  }
  
  // Quiz Attempts
  async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    const attempts = this.readDataFile<QuizAttempt>('quizAttempts.json');
    return attempts.filter(attempt => attempt.quizId === quizId);
  }
  
  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    try {
      const id = this.currentQuizAttemptId++;
      const attempt: QuizAttempt = {
        id,
        ...attemptData,
        createdAt: new Date(),
      };
      
      const attempts = this.readDataFile<QuizAttempt>('quizAttempts.json');
      attempts.push(attempt);
      this.writeDataFile('quizAttempts.json', attempts);
      this.saveCounters();
      
      return attempt;
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      throw error;
    }
  }
}

export const storage = new LocalStorage();
