'use client';

import { useState, useMemo } from 'react';
import { 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskWithMeta } from '@/types/task';
import Link from 'next/link';

interface CalendarViewProps {
  tasks: TaskWithMeta[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = addDays(monthStart, -monthStart.getDay()); // Start from previous Sunday
    const endDate = addDays(monthEnd, 6 - monthEnd.getDay()); // End on next Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const daysInWeek = useMemo(() => {
    const weekStart = addDays(currentDate, -currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  const days = view === 'month' ? daysInMonth : daysInWeek;

  const tasksByDate = useMemo(() => {
    const taskMap: Record<string, TaskWithMeta[]> = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!taskMap[dateKey]) {
          taskMap[dateKey] = [];
        }
        taskMap[dateKey].push(task);
      }
    });
    
    return taskMap;
  }, [tasks]);

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </h2>
          <Button variant="outline" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>Today</Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={view === 'month' ? 'default' : 'outline'} 
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button 
            variant={view === 'week' ? 'default' : 'outline'} 
            onClick={() => setView('week')}
          >
            Week
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-white p-2 text-center font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar cells */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div 
              key={dateKey}
              className={`bg-white min-h-[100px] ${view === 'week' ? 'h-[200px]' : ''} p-1 border-t border-gray-200 ${
                isCurrentMonth ? 'opacity-100' : 'opacity-50 bg-gray-50'
              } ${isToday(day) ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {dayTasks.length}
                  </Badge>
                )}
              </div>
              <div className="overflow-y-auto max-h-[80px]">
                {dayTasks.map((task) => (
                  <Link 
                    href={`/task/${task.id}`} 
                    key={task.id}
                    className="block mb-1"
                  >
                    <div className="flex items-center text-xs p-1 rounded bg-gray-50 hover:bg-gray-100">
                      <div className={`w-1 h-full mr-1 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 