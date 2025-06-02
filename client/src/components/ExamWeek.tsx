import { useEffect, useState } from "react";
import { ExamWeek as ExamWeekType, Exam } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { SubjectIcon, getSubjectLightColor, getSubjectName } from "./SubjectIcons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import duration from "dayjs/plugin/duration";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

dayjs.extend(duration);
dayjs.locale("ar");

interface ExamWeekProps {
  week: ExamWeekType;
  exams: Exam[];
  onDelete?: (id: number) => void;
}

const ExamWeek: React.FC<ExamWeekProps> = ({ exams, onDelete }) => {
  const { isAdmin } = useAuth();
  const [remainingTimes, setRemainingTimes] = useState<{ [key: string]: string }>({});
  const [sortedExams, setSortedExams] = useState<Exam[]>([]);
  const [isDraggable, setIsDraggable] = useState(false);

  useEffect(() => {
    setSortedExams(
      [...exams].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
    );
  }, [exams]);

  const calculateRemainingTime = (date: string) => {
    const examDate = dayjs(date).hour(3).minute(0); // اليوم ينتهي 3:00 فجرًا
    const now = dayjs();
    const diff = examDate.diff(now);

    if (diff <= 0) return "انتهى الوقت";

    const duration = dayjs.duration(diff);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (days > 1) return `باقي ${days} يوم`;
    if (days === 1) return `باقي يوم و ${hours}:${minutes}:${seconds}`;
    return `باقي ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    const updateTimes = () => {
      const times: { [key: string]: string } = {};
      sortedExams.forEach((exam) => {
        times[exam.id] = calculateRemainingTime(exam.date);
      });
      setRemainingTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [sortedExams]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedExams);
    const [movedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, movedItem);
    setSortedExams(items);
  };

  const deleteExam = (id: number) => {
    onDelete?.(id);
  };

  return (
    <div className="space-y-4">

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="exams">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
                snapshot.isDraggingOver ? "bg-accent/10 rounded-lg p-4" : ""
              }`}
            >
              {sortedExams.map((exam, index) => {
                const subjectClass = getSubjectLightColor(exam.subject as any);
                const subjectName = getSubjectName(exam.subject as any);

                return isDraggable ? (
                  <Draggable
                    key={exam.id}
                    draggableId={exam.id.toString()}
                    index={index}
                  >
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <Card className="overflow-hidden">
                          <div className={`p-4 ${subjectClass} flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-5 h-5 cursor-move" />
                              </div>
                              <SubjectIcon subject={exam.subject as any} className="w-6 h-6" />
                              <span className="font-semibold">{subjectName}</span>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteExam(exam.id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <ExamDetails exam={exam} remainingTime={remainingTimes[exam.id]} />
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ) : (
                  <div key={exam.id}>
                    <Card className="overflow-hidden">
                      <div className={`p-4 ${subjectClass} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <SubjectIcon subject={exam.subject as any} className="w-6 h-6" />
                          <span className="font-semibold">{subjectName}</span>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExam(exam.id);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <ExamDetails exam={exam} remainingTime={remainingTimes[exam.id]} />
                    </Card>
                  </div>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

const ExamDetails = ({
  exam,
  remainingTime,
}: {
  exam: Exam;
  remainingTime: string;
}) => {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">اليوم:</span>
        <span>{dayjs(exam.date).format("dddd")}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">التاريخ:</span>
        <span>{dayjs(exam.date).format("DD/MM/YYYY")}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">الوقت المتبقي:</span>
        <span className="font-medium">{remainingTime}</span>
      </div>

      <div className="mt-4">
        <span className="text-gray-600 dark:text-gray-400 block mb-2">الدروس المقررة:</span>
        <ul className="list-disc list-inside space-y-1">
          {exam.topics.map((topic, index) => (
            <li key={index} className="text-sm">{topic}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExamWeek;