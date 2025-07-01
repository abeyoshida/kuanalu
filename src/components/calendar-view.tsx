'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskWithMeta } from '@/types/task';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/use-media-query';

interface CalendarViewProps {
  tasks: TaskWithMeta[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // Set default view based on screen size
  useEffect(() => {
    if (isMobile) {
      setView('agenda');
    } else if (isTablet && view === 'agenda') {
      setView('week');
    }
  }, [isMobile, isTablet, view]);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = addDays(monthStart, -monthStart.getDay()); // Start from previous Sunday
    const endDate = addDays(monthEnd, 6 - monthEnd.getDay()); // End on next Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const daysInWeek = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
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

  // Get all tasks for the current month/week for agenda view
  const currentViewTasks = useMemo(() => {
    if (view !== 'agenda') return [];
    
    const allTasks: Array<{ task: TaskWithMeta, dateKey: string }> = [];
    
    // Add all tasks with due dates in the current view
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayTasks = tasksByDate[dateKey] || [];
      dayTasks.forEach(task => {
        allTasks.push({ task, dateKey });
      });
    });
    
    // Sort by date then priority
    return allTasks.sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.dateKey).getTime();
      const dateB = new Date(b.dateKey).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // Then by priority
      const priorityMap: Record<string, number> = {
        urgent: 4, high: 3, medium: 2, low: 1
      };
      return (priorityMap[b.task.priority] || 0) - (priorityMap[a.task.priority] || 0);
    });
  }, [days, tasksByDate, view]);

  // Render the calendar grid view (month or week)
  const renderCalendarGrid = () => {
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-white p-2 text-center font-medium">
            {isMobile ? day.charAt(0) : day}
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
              className={`bg-white ${view === 'week' ? 'min-h-[120px]' : 'min-h-[80px] md:min-h-[100px]'} p-1 border-t border-gray-200 ${
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
              <div className={`overflow-y-auto ${view === 'week' ? 'max-h-[80px]' : 'max-h-[40px] md:max-h-[60px]'}`}>
                {dayTasks.slice(0, view === 'week' ? 5 : (isMobile ? 1 : 3)).map((task) => (
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
                {dayTasks.length > (view === 'week' ? 5 : (isMobile ? 1 : 3)) && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - (view === 'week' ? 5 : (isMobile ? 1 : 3))} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render the agenda view for mobile
  const renderAgendaView = () => {
    if (currentViewTasks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No tasks scheduled for this {view === 'month' ? 'month' : 'week'}
        </div>
      );
    }

    let currentDateKey = '';
    
    return (
      <div className="space-y-4">
        {currentViewTasks.map(({ task, dateKey }) => {
          const showDateHeader = dateKey !== currentDateKey;
          if (showDateHeader) {
            currentDateKey = dateKey;
          }
          
          return (
            <div key={task.id}>
              {showDateHeader && (
                <div className={`text-sm font-medium pt-4 ${isToday(new Date(dateKey)) ? 'text-blue-600' : ''}`}>
                  {format(new Date(dateKey), 'EEEE, MMMM d')}
                </div>
              )}
              <Link 
                href={`/task/${task.id}`}
                className="flex items-center p-2 border-l-4 rounded-r-md mb-1 bg-white hover:bg-gray-50"
                style={{ borderLeftColor: getPriorityColor(task.priority).replace('bg-', '') }}
              >
                <div className="ml-2">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(new Date(task.dueDate!), 'h:mm a')}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePrevious} size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg md:text-xl font-semibold">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </h2>
          <Button variant="outline" onClick={handleNext} size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} size="sm">Today</Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={view === 'month' ? 'default' : 'outline'} 
            onClick={() => setView('month')}
            size="sm"
            className={isMobile ? 'hidden' : ''}
          >
            Month
          </Button>
          <Button 
            variant={view === 'week' ? 'default' : 'outline'} 
            onClick={() => setView('week')}
            size="sm"
            className={isMobile ? 'hidden' : ''}
          >
            Week
          </Button>
          <Button 
            variant={view === 'agenda' ? 'default' : 'outline'} 
            onClick={() => setView('agenda')}
            size="sm"
          >
            Agenda
          </Button>
        </div>
      </div>

      {view === 'agenda' ? renderAgendaView() : renderCalendarGrid()}
    </div>
  );
} 