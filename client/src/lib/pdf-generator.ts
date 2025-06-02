import html2pdf from "html2pdf.js";

// Define day order for sorting
export const dayOrder = {
  'الأحد': 0,
  'الاثنين': 1,
  'الثلاثاء': 2,
  'الأربعاء': 3,
  'الخميس': 4,
  'الجمعة': 5,
  'السبت': 6
};

export async function generateQuizPDF(
  title: string,
  subject: string,
  creator: string,
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[]
): Promise<Blob> {
  // إنشاء عنصر HTML وتحضيره للطباعة
  const container = document.createElement("div");
  container.style.direction = "rtl";
  container.style.fontFamily = "'Amiri', serif"; // خط يدعم العربية
  container.style.padding = "20px";

  // تحميل الخط من Google Fonts (يجب أن يكون مضمنًا في HTML الرئيسي أيضًا)
  const fontLink = document.createElement("link");
  fontLink.href = "https://fonts.googleapis.com/css2?family=Amiri&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);

  container.innerHTML = `
    <style>
      * {
        font-family: 'Amiri', serif;
        line-height: 1.8;
      }
    </style>
    <h1 style="font-size: 24px; margin-bottom: 20px; text-align: center;">${title}</h1>
    <div style="font-size: 14px; margin-bottom: 10px;">المادة: ${subject}</div>
    <div style="font-size: 14px; margin-bottom: 10px;">المنشئ: ${creator}</div>
    <div style="font-size: 14px; margin-bottom: 30px;">عدد الأسئلة: ${questions.length}</div>
    ${questions.map((q, index) => `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: bold;">السؤال ${index + 1}:</div>
        <div style="font-size: 14px; margin: 10px 20px;">${q.question}</div>
        ${q.options.map((option, optIndex) => `
          <div style="font-size: 13px; margin: 5px 40px;">
            ${optIndex === q.correctAnswer ? '★' : '○'} ${option}
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;

  // إعدادات PDF
  const options = {
    margin: [10, 10, 10, 10],
    filename: `${title}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  try {
    const pdfBlob = await html2pdf().from(container).set(options).outputPdf('blob');
    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("فشل في إنشاء ملف PDF");
  }
}
