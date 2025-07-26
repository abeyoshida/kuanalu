'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { 
  tasks, 
  projects, 
  organizationMembers, 
  users
} from "@/lib/db/schema";
import { and, eq, count, desc, asc, gte, lt, isNull, or, inArray } from "drizzle-orm";

// Types for dashboard data
export interface DashboardStats {
  totalProjects: number;
  completedTasks: number;
  pendingTasks: number;
  recentActivity: ActivityItem[];
  upcomingDeadlines: DeadlineItem[];
}

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: Date;
  userDisplayName: string;
  type: 'task_completed' | 'task_created' | 'project_created';
}

export interface DeadlineItem {
  id: number;
  title: string;
  dueDate: Date;
  priority: string;
  projectName: string;
  daysUntilDue: number;
}

/**
 * Get comprehensive dashboard statistics for the current user
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('User not authenticated');
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get user's organizations
    const userOrganizations = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId));
    
    const orgIds = userOrganizations.map(org => org.organizationId);
    
    if (orgIds.length === 0) {
      return {
        totalProjects: 0,
        completedTasks: 0,
        pendingTasks: 0,
        recentActivity: [],
        upcomingDeadlines: []
      };
    }
    
    // Run all queries in parallel for better performance
    const [
      totalProjectsResult,
      completedTasksResult,
      pendingTasksResult,
      recentActivityData,
      upcomingDeadlinesData
    ] = await Promise.all([
      getTotalProjects(orgIds),
      getCompletedTasks(orgIds),
      getPendingTasks(orgIds),
      getRecentActivity(orgIds),
      getUpcomingDeadlines(orgIds)
    ]);
    
    return {
      totalProjects: totalProjectsResult,
      completedTasks: completedTasksResult,
      pendingTasks: pendingTasksResult,
      recentActivity: recentActivityData,
      upcomingDeadlines: upcomingDeadlinesData
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    throw new Error('Failed to load dashboard data');
  }
}

/**
 * Get total projects count for user's organizations
 */
async function getTotalProjects(orgIds: number[]): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(projects)
    .where(
      and(
        inArray(projects.organizationId, orgIds),
        isNull(projects.archivedAt)
      )
    );
  
  return Number(result.count);
}

/**
 * Get completed tasks count for user's organizations
 */
async function getCompletedTasks(orgIds: number[]): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        inArray(projects.organizationId, orgIds),
        eq(tasks.status, 'done'),
        isNull(tasks.archivedAt)
      )
    );
  
  return Number(result.count);
}

/**
 * Get pending tasks count for user's organizations
 */
async function getPendingTasks(orgIds: number[]): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        inArray(projects.organizationId, orgIds),
        or(
          eq(tasks.status, 'todo'),
          eq(tasks.status, 'today'),
          eq(tasks.status, 'in_progress'),
          eq(tasks.status, 'in_review')
        ),
        isNull(tasks.archivedAt)
      )
    );
  
  return Number(result.count);
}

/**
 * Get recent activity derived from task and project changes
 */
async function getRecentActivity(orgIds: number[]): Promise<ActivityItem[]> {
  // Get recently completed tasks
  const completedTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      completedAt: tasks.completedAt,
      assigneeName: users.name,
      projectName: projects.name
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(
      and(
        inArray(projects.organizationId, orgIds),
        eq(tasks.status, 'done'),
        isNull(tasks.archivedAt)
      )
    )
    .orderBy(desc(tasks.completedAt))
    .limit(10);
  
  // Get recently created tasks
  const createdTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      createdAt: tasks.createdAt,
      creatorName: users.name,
      projectName: projects.name
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(users, eq(tasks.createdBy, users.id))
    .where(
      and(
        inArray(projects.organizationId, orgIds),
        isNull(tasks.archivedAt)
      )
    )
    .orderBy(desc(tasks.createdAt))
    .limit(10);
  
  // Combine and format activity items
  const activities: ActivityItem[] = [];
  
  // Add completed tasks
  completedTasks.forEach(task => {
    if (task.completedAt) {
      activities.push({
        id: `task-completed-${task.id}`,
        description: `Task "${task.title}" was completed`,
        timestamp: task.completedAt,
        userDisplayName: task.assigneeName || 'Unknown User',
        type: 'task_completed'
      });
    }
  });
  
  // Add created tasks
  createdTasks.forEach(task => {
    activities.push({
      id: `task-created-${task.id}`,
      description: `New task "${task.title}" was created`,
      timestamp: task.createdAt,
      userDisplayName: task.creatorName || 'Unknown User',
      type: 'task_created'
    });
  });
  
  // Sort by timestamp and return top 5 most recent
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
}

/**
 * Get upcoming deadlines for user's organizations
 */
async function getUpcomingDeadlines(orgIds: number[]): Promise<DeadlineItem[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const upcomingTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      projectName: projects.name
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        inArray(projects.organizationId, orgIds),
        or(
          eq(tasks.status, 'todo'),
          eq(tasks.status, 'today'),
          eq(tasks.status, 'in_progress'),
          eq(tasks.status, 'in_review')
        ),
        gte(tasks.dueDate, now),
        lt(tasks.dueDate, thirtyDaysFromNow),
        isNull(tasks.archivedAt)
      )
    )
    .orderBy(asc(tasks.dueDate))
    .limit(5);
  
  return upcomingTasks
    .filter(task => task.dueDate)
    .map(task => {
      const daysUntilDue = Math.ceil(
        (task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        id: task.id,
        title: task.title,
        dueDate: task.dueDate!,
        priority: task.priority || 'medium',
        projectName: task.projectName,
        daysUntilDue
      };
    });
} 