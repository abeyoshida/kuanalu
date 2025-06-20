import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  pgEnum,
  primaryKey,
  uuid,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for task status and priority
export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done'
]);

export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'urgent'
]);

// Task type enum
export const taskTypeEnum = pgEnum('task_type', [
  'feature',
  'bug',
  'improvement',
  'documentation',
  'task',
  'epic'
]);

// Comment type enum
export const commentTypeEnum = pgEnum('comment_type', [
  'text',
  'code',
  'attachment',
  'system',
  'mention'
]);

// Role enum for organization members
export const roleEnum = pgEnum('role', [
  'owner',
  'admin',
  'member',
  'guest'
]);

// User status enum
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'inactive',
  'suspended',
  'pending'
]);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'on_hold',
  'completed',
  'canceled'
]);

// Project visibility enum
export const projectVisibilityEnum = pgEnum('project_visibility', [
  'public',
  'private',
  'team_only'
]);

// Organization visibility enum
export const visibilityEnum = pgEnum('visibility', [
  'public',
  'private'
]);

// Organizations table
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly name
  description: text('description'),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  logo: text('logo'), // URL to organization logo
  website: text('website'), // Organization website URL
  settings: jsonb('settings'), // JSON field for organization settings (theme, notifications, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'), // Hashed password
  image: text('image'), // Profile image URL
  bio: text('bio'), // User bio
  jobTitle: text('job_title'), // Professional title
  department: text('department'), // Department or team
  location: text('location'), // User's location
  timezone: text('timezone'), // User's timezone
  phoneNumber: text('phone_number'), // Contact phone number
  status: userStatusEnum('status').notNull().default('active'),
  isAdmin: boolean('is_admin').notNull().default(false), // System-wide admin flag
  lastActive: timestamp('last_active'), // Last user activity timestamp
  preferences: jsonb('preferences'), // User preferences (notifications, theme, etc.)
  metadata: jsonb('metadata'), // Additional user metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User sessions table for tracking login sessions
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull()
});

// Organization members (junction table for users and organizations)
export const organizationMembers = pgTable('organization_members', {
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('member'), // 'owner', 'admin', 'member'
  title: text('title'), // Optional job title/position within the organization
  invitedBy: integer('invited_by').references(() => users.id), // Who invited this member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.organizationId] })
  };
});

// User permissions table for fine-grained permissions
export const userPermissions = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  resource: text('resource').notNull(), // The resource type (e.g., 'task', 'project', 'organization')
  action: text('action').notNull(), // The action (e.g., 'create', 'read', 'update', 'delete')
  granted: boolean('granted').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    // Ensure uniqueness for user-resource-action combination
    resourceActionUnique: primaryKey({
      columns: [table.userId, table.resource, table.action, 
        table.organizationId || null, table.projectId || null]
    })
  };
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly name
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('planning'),
  visibility: projectVisibilityEnum('visibility').notNull().default('private'),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  ownerId: integer('owner_id').notNull().references(() => users.id), // Project owner/manager
  startDate: timestamp('start_date'),
  targetDate: timestamp('target_date'), // Target completion date
  completedDate: timestamp('completed_date'), // Actual completion date
  icon: text('icon'), // Project icon or emoji
  color: text('color'), // Project color for UI
  metadata: jsonb('metadata'), // Additional project metadata
  settings: jsonb('settings'), // Project settings (columns, workflow, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  archivedAt: timestamp('archived_at') // When the project was archived (null if not archived)
});

// Project members (junction table for users and projects)
export const projectMembers = pgTable('project_members', {
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('member'), // 'owner', 'admin', 'member'
  addedBy: integer('added_by').references(() => users.id), // Who added this member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.projectId] })
  };
});

// Project categories/labels
export const projectCategories = pgTable('project_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'), // Color for UI
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Junction table for projects and categories (many-to-many)
export const projectCategoryAssignments = pgTable('project_category_assignments', {
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => projectCategories.id, { onDelete: 'cascade' }),
  assignedBy: integer('assigned_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.projectId, table.categoryId] })
  };
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: priorityEnum('priority').notNull().default('medium'),
  type: taskTypeEnum('type').notNull().default('task'),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  assigneeId: integer('assignee_id').references(() => users.id),
  reporterId: integer('reporter_id').references(() => users.id), // Person who reported/created the task
  parentTaskId: integer('parent_task_id'), // For hierarchical tasks (epics, subtasks)
  dueDate: timestamp('due_date'),
  startDate: timestamp('start_date'),
  estimatedHours: integer('estimated_hours'), // Time estimation
  actualHours: integer('actual_hours'), // Actual time spent
  points: integer('points'), // Story points for agile methodologies
  position: integer('position'), // For ordering tasks within a status column
  labels: jsonb('labels'), // Array of labels/tags
  metadata: jsonb('metadata'), // Additional custom fields
  completedAt: timestamp('completed_at'), // When the task was marked as done
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  archivedAt: timestamp('archived_at') // For soft deletion
});

// Subtasks table
export const subtasks = pgTable('subtasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  priority: text('priority'),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  assigneeId: integer('assignee_id').references(() => users.id),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  dueDate: timestamp('due_date'),
  position: integer('position'),
  metadata: jsonb('metadata'),
  completedAt: timestamp('completed_at'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Comments table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  type: commentTypeEnum('type').default('text'),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  parentId: integer('parent_id'), // Self-reference will be handled in relations
  edited: boolean('edited').default(false),
  editedAt: timestamp('edited_at'),
  editedBy: integer('edited_by').references(() => users.id),
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  metadata: jsonb('metadata'),
  mentions: jsonb('mentions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Invitations table
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  token: uuid('token').notNull().unique(), // Unique token for invitation link
  email: text('email').notNull(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('member'),
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // pending, accepted, expired
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Define relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  projects: many(projects),
  invitations: many(invitations),
  projectCategories: many(projectCategories)
}));

export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizationMembers),
  ownedProjects: many(projects, { relationName: 'owner' }),
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks, { relationName: 'assignee' }),
  reportedTasks: many(tasks, { relationName: 'reporter' }),
  createdTasks: many(tasks, { relationName: 'creator' }),
  assignedSubtasks: many(subtasks, { relationName: 'assignee' }),
  createdSubtasks: many(subtasks, { relationName: 'creator' }),
  comments: many(comments, { relationName: 'user' }),
  editedComments: many(comments, { relationName: 'editor' }),
  resolvedComments: many(comments, { relationName: 'resolver' }),
  sentInvitations: many(invitations, { relationName: 'inviter' }),
  sessions: many(userSessions),
  permissions: many(userPermissions)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id]
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: 'owner'
  }),
  members: many(projectMembers),
  tasks: many(tasks),
  categoryAssignments: many(projectCategoryAssignments)
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id]
  }),
  addedByUser: one(users, {
    fields: [projectMembers.addedBy],
    references: [users.id]
  })
}));

export const projectCategoriesRelations = relations(projectCategories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projectCategories.organizationId],
    references: [organizations.id]
  }),
  createdByUser: one(users, {
    fields: [projectCategories.createdBy],
    references: [users.id]
  }),
  projectAssignments: many(projectCategoryAssignments)
}));

export const projectCategoryAssignmentsRelations = relations(projectCategoryAssignments, ({ one }) => ({
  project: one(projects, {
    fields: [projectCategoryAssignments.projectId],
    references: [projects.id]
  }),
  category: one(projectCategories, {
    fields: [projectCategoryAssignments.categoryId],
    references: [projectCategories.id]
  }),
  assignedByUser: one(users, {
    fields: [projectCategoryAssignments.assignedBy],
    references: [users.id]
  })
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id]
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: 'assignee'
  }),
  reporter: one(users, {
    fields: [tasks.reporterId],
    references: [users.id],
    relationName: 'reporter'
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: 'creator'
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'parentTask'
  }),
  childTasks: many(tasks, { relationName: 'parentTask' }),
  subtasks: many(subtasks),
  comments: many(comments)
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id]
  }),
  assignee: one(users, {
    fields: [subtasks.assigneeId],
    references: [users.id]
  }),
  creator: one(users, {
    fields: [subtasks.createdBy],
    references: [users.id]
  })
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id]
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id]
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id]
  }),
  replies: many(comments, { relationName: 'replies' }),
  editor: one(users, {
    fields: [comments.editedBy],
    references: [users.id]
  }),
  resolver: one(users, {
    fields: [comments.resolvedBy],
    references: [users.id]
  })
}));

// Invitations relations
export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id]
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
    relationName: 'inviter'
  })
}));

// User sessions relations
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  })
}));

// User permissions relations
export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [userPermissions.organizationId],
    references: [organizations.id]
  }),
  project: one(projects, {
    fields: [userPermissions.projectId],
    references: [projects.id]
  })
})); 