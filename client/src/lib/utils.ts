import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { jsPDF } from "jspdf";
import { Questions } from "@shared/schema";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Generate a PDF from quiz questions and answers
export const generateQuizPDF = (title: string, subject: string, creator: string, questions: Questions): Blob => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Add Arabic font
  doc.addFont("/assets/fonts/NotoNaskhArabic-Regular.ttf", "NotoNaskh", "normal");
  doc.setFont("NotoNaskh");
  doc.setR2L(true);

  // Add title
  doc.setFontSize(22);
  doc.text(title, doc.internal.pageSize.width - 20, 20, { align: "right" });

  // Add quiz info
  doc.setFontSize(14);
  doc.text(`المادة: ${subject}`, doc.internal.pageSize.width - 20, 30, { align: "right" });
  doc.text(`المنشئ: ${creator}`, doc.internal.pageSize.width - 20, 40, { align: "right" });
  doc.text(`عدد الأسئلة: ${questions.length}`, doc.internal.pageSize.width - 20, 50, { align: "right" });

  let yPosition = 70;

  // Add questions and options
  questions.forEach((q, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text(`السؤال ${index + 1}: ${q.question}`, doc.internal.pageSize.width - 20, yPosition, { align: "right" });
    yPosition += 10;

    doc.setFontSize(12);
    q.options.forEach((option, optIndex) => {
      const marker = optIndex === q.correctAnswer ? "★" : "○";
      doc.text(`${marker} ${option}`, doc.internal.pageSize.width - 25, yPosition, { align: "right" });
      yPosition += 10;
    });

    yPosition += 10;
  });

  return doc.output("blob");
};

export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};