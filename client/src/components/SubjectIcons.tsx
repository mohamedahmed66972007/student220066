import React from "react";
import { 
  BookText, 
  Languages, 
  Calculator, 
  FlaskRound, 
  Atom, 
  Dna, 
  GraduationCap, 
  BookOpenText,
  FolderIcon,
  CalendarDays,
  PenSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Subject = "arabic" | "english" | "math" | "chemistry" | "physics" | "biology" | "constitution" | "islamic" | "geology";

interface SubjectIconProps {
  subject: Subject;
  size?: number;
  className?: string;
}

export const SubjectIcon: React.FC<SubjectIconProps> = ({ subject, size = 24, className }) => {
  switch (subject) {
    case "arabic":
      return <BookText size={size} className={cn("arabic-text", className)} />;
    case "english":
      return <Languages size={size} className={cn("english-text", className)} />;
    case "math":
      return <Calculator size={size} className={className} />;
    case "chemistry":
      return <FlaskRound size={size} className={cn("chemistry-text", className)} />;
    case "physics":
      return <Atom size={size} className={cn("physics-text", className)} />;
    case "biology":
      return <Dna size={size} className={cn("biology-text", className)} />;
    case "constitution":
      return <GraduationCap size={size} className={cn("constitution-text", className)} />;
    case "islamic":
      return <BookOpenText size={size} className={cn("islamic-text", className)} />;
    case "geology":
      return <Atom size={size} className={className} />;
    default:
      return <FolderIcon size={size} className={className} />;
  }
};

export const NavIcons = {
  files: FolderIcon,
  exams: CalendarDays,
  quizzes: PenSquare
};

export const getSubjectColor = (subject: Subject): string => {
  switch (subject) {
    case "arabic":
      return "arabic-bg";
    case "english":
      return "english-bg";
    case "math":
      return "math-bg";
    case "chemistry":
      return "chemistry-bg";
    case "physics":
      return "physics-bg";
    case "biology":
      return "biology-bg";
    case "constitution":
      return "constitution-bg";
    case "islamic":
      return "islamic-bg";
    case "geology":
        return "geology-bg";
    default:
      return "bg-gray-500";
  }
};

export const getSubjectLightColor = (subject: Subject): string => {
  switch (subject) {
    case "arabic":
      return "arabic-bg-light arabic-text";
    case "english":
      return "english-bg-light english-text";
    case "math":
      return "math-bg-light math-text";
    case "chemistry":
      return "chemistry-bg-light chemistry-text";
    case "physics":
      return "physics-bg-light physics-text";
    case "biology":
      return "biology-bg-light biology-text";
    case "constitution":
      return "constitution-bg-light constitution-text";
    case "islamic":
      return "islamic-bg-light islamic-text";
    case "geology":
        return "geology-bg-light geology-text";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

export const getSubjectName = (subject: Subject): string => {
  switch (subject) {
    case "arabic":
      return "اللغة العربية";
    case "english":
      return "اللغة الإنجليزية";
    case "math":
      return "الرياضيات";
    case "chemistry":
      return "الكيمياء";
    case "physics":
      return "الفيزياء";
    case "biology":
      return "الأحياء";
    case "constitution":
      return "الدستور";
    case "islamic":
      return "التربية الإسلامية";
    case "geology":
      return "الجيولوجيا";
    default:
      return "";
  }
};

export const subjectOptions = [
  { value: "arabic", label: "اللغة العربية" },
  { value: "english", label: "اللغة الإنجليزية" },
  { value: "math", label: "الرياضيات" },
  { value: "chemistry", label: "الكيمياء" },
  { value: "physics", label: "الفيزياء" },
  { value: "biology", label: "الأحياء" },
  { value: "constitution", label: "الدستور" },
  { value: "islamic", label: "التربية الإسلامية" },
  { value: "geology", label: "الجيولوجيا" },
];

export const semesterOptions = [
  { value: "first", label: "الفصل الأول" },
  { value: "second", label: "الفصل الثاني" },
];

export const dayOptions = [
  { value: "الأحد", label: "الأحد" },
  { value: "الإثنين", label: "الإثنين" },
  { value: "الثلاثاء", label: "الثلاثاء" },
  { value: "الأربعاء", label: "الأربعاء" },
  { value: "الخميس", label: "الخميس" },
];

export const getSubjectImage = (subject: Subject): string => {
  switch (subject) {
    case "arabic":
      return "https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "english":
      return "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "math":
      return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "chemistry":
      return "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "physics":
      return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "biology":
      return "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "constitution":
      return "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "islamic":
      return "https://images.unsplash.com/photo-1585036156261-1a6cfca75ef3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    case "geology":
      return "https://images.unsplash.com/photo-1585036156261-1a6cfca75ef3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
    default:
      return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
  }
};