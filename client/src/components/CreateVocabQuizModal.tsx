import React, { useState } from "react";
import { useQuizzes } from "@/hooks/useQuizzes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateVocabQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateVocabQuizModal: React.FC<CreateVocabQuizModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [englishWords, setEnglishWords] = useState("");
  const [arabicMeanings, setArabicMeanings] = useState("");
  const [description, setDescription] = useState("");

  const { createQuiz, isCreating } = useQuizzes();
  const { toast } = useToast();

  const normalizeArabicText = (text: string): string => {
    let normalized = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      // تطبيع الهمزات
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ؤ]/g, 'و')
      .replace(/[ئ]/g, 'ي')
      // تطبيع التاء المربوطة والهاء
      .replace(/[ة]/g, 'ه')
      // إزالة التشكيل
      .replace(/[\u064B-\u0652]/g, '');
    
    // إزالة جميع أشكال الجمع الشائعة
    const pluralSuffixes = ['ات', 'ون', 'ين', 'ان', 'ها', 'هم', 'هن', 'كم', 'كن'];
    pluralSuffixes.forEach(suffix => {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length);
      }
    });
    
    return normalized;
  };

  const removeDefiniteArticle = (text: string): string => {
    // إزالة "ال" التعريف من بداية الكلمة
    return text.replace(/^ال/, '');
  };

  const generateGenderVariations = (text: string): string[] => {
    const variations = [text];
    
    // إضافة نسخة بدون التاء المربوطة أو الهاء في نهاية الكلمة
    if (text.endsWith('ة') || text.endsWith('ه')) {
      variations.push(text.slice(0, -1));
    } else {
      // إضافة نسخة مع التاء المربوطة والهاء
      variations.push(text + 'ة');
      variations.push(text + 'ه');
    }
    
    return variations;
  };

  const generateAcceptedAnswers = (arabicText: string): string[] => {
    // تقسيم النص بناءً على الفاصل / أو \
    const meanings = arabicText.split(/[\/\\]/).map(meaning => meaning.trim()).filter(meaning => meaning.length > 0);
    
    const allAcceptedAnswers: string[] = [];
    
    meanings.forEach(meaning => {
      const baseAnswer = normalizeArabicText(meaning);
      const originalAnswer = meaning.trim();
      
      // إضافة الإجابة الأصلية والمطبعة
      allAcceptedAnswers.push(originalAnswer, baseAnswer);
      
      // إنشاء اختلافات المذكر والمؤنث
      const genderVariationsBase = generateGenderVariations(baseAnswer);
      const genderVariationsOriginal = generateGenderVariations(originalAnswer);
      
      allAcceptedAnswers.push(...genderVariationsBase, ...genderVariationsOriginal);
      
      // إضافة نسخ مع وبدون "ال" التعريف لجميع الاختلافات
      [...genderVariationsBase, ...genderVariationsOriginal].forEach(variation => {
        const withoutAl = removeDefiniteArticle(variation);
        if (withoutAl !== variation) {
          allAcceptedAnswers.push(withoutAl);
        }
        
        // إضافة نسخ مع "ال" التعريف إذا لم تكن موجودة
        if (!variation.startsWith('ال')) {
          allAcceptedAnswers.push('ال' + variation);
        }
      });
      
      // إضافة نسخ مع اللواحق المختلفة لجميع الاختلافات
      const suffixes = ['ات', 'ون', 'ين', 'ان'];
      const allVariations = [...genderVariationsBase, ...genderVariationsOriginal];
      
      allVariations.forEach(variation => {
        const withoutAl = removeDefiniteArticle(variation);
        
        suffixes.forEach(suffix => {
          allAcceptedAnswers.push(variation + suffix);
          allAcceptedAnswers.push(withoutAl + suffix);
          allAcceptedAnswers.push('ال' + variation + suffix);
          allAcceptedAnswers.push('ال' + withoutAl + suffix);
        });
      });
    });
    
    // إزالة المكررات والفراغات
    return [...new Set(allAcceptedAnswers.filter(answer => answer.length > 0))];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !creator.trim() || !englishWords.trim() || !arabicMeanings.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const englishList = englishWords.split('\n').filter(word => word.trim());
    const arabicList = arabicMeanings.split('\n').filter(meaning => meaning.trim());

    if (englishList.length !== arabicList.length) {
      toast({
        title: "خطأ",
        description: "عدد الكلمات الإنجليزية يجب أن يساوي عدد المعاني العربية",
        variant: "destructive",
      });
      return;
    }

    if (englishList.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمات للاختبار",
        variant: "destructive",
      });
      return;
    }

    try {
      // إنشاء الأسئلة
      const questions = englishList.map((englishWord, index) => {
        const arabicMeaning = arabicList[index].trim();
        
        // إنشاء قائمة الإجابات المقبولة المحسنة
        const acceptedAnswers = generateAcceptedAnswers(arabicMeaning);

        return {
          question: `ما معنى كلمة "${englishWord.trim()}" باللغة العربية؟`,
          type: 'essay' as const,
          acceptedAnswers: acceptedAnswers
        };
      });

      await createQuiz({
        title: title.trim(),
        subject: 'english',
        creator: creator.trim(),
        description: description.trim() || `اختبار كلمات إنجليزية يحتوي على ${englishList.length} كلمة`,
        questions: questions,
        randomizeQuestions: true,
      });

      toast({
        title: "تم إنشاء الاختبار بنجاح",
        description: `تم إنشاء اختبار كلمات إنجليزية بـ ${englishList.length} سؤال`,
      });

      // إعادة تعيين النموذج
      setTitle("");
      setCreator("");
      setEnglishWords("");
      setArabicMeanings("");
      setDescription("");
      onClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الاختبار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">إنشاء اختبار كلمات إنجليزية</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الاختبار *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: اختبار كلمات الوحدة الأولى"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator">االأسم*</Label>
              <Input
                id="creator"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="اكتب اسمك هنا"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف الاختبار (اختياري)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للاختبار"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="englishWords">الكلمات الإنجليزية *</Label>
              <Textarea
                id="englishWords"
                value={englishWords}
                onChange={(e) => setEnglishWords(e.target.value)}
                rows={10}
                placeholder="اكتب الكلمات الإنجليزية، كلمة في كل سطر&#10;مثال:&#10;book&#10;house&#10;car&#10;school"
                className="font-mono"
                required
              />
              <p className="text-sm text-gray-500">
                اكتب كل كلمة إنجليزية في سطر منفصل
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arabicMeanings">المعاني العربية *</Label>
              <Textarea
                id="arabicMeanings"
                value={arabicMeanings}
                onChange={(e) => setArabicMeanings(e.target.value)}
                rows={10}
                placeholder="اكتب المعاني العربية، معنى في كل سطر&#10;مثال:&#10;كتاب&#10;منزل / بيت&#10;سيارة \ عربة&#10;مدرسة"
                required
              />
              <p className="text-sm text-gray-500">
                اكتب كل معنى عربي في سطر منفصل. يمكنك إضافة معاني متعددة للكلمة الواحدة باستخدام / أو \
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              ملاحظات مهمة:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• تأكد من أن عدد الكلمات الإنجليزية يساوي عدد المعاني العربية</li>
              <li>• يمكنك إضافة معاني متعددة للكلمة الواحدة باستخدام / أو \ (مثال: بث / اذاعة)</li>
              <li>• سيتم تجاهل اختلافات الهمزة والتاء المربوطة في التصحيح</li>
              <li>• سيتم تجاهل الفرق بين المفرد والجمع في التصحيح</li>
              <li>• ستظهر الكلمات بترتيب عشوائي للطلاب</li>
            </ul>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <span className="animate-spin ml-2">◌</span>
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء الاختبار"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVocabQuizModal;
