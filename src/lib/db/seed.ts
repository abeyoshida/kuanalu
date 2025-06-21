import { db } from "@/lib/db";
import { 
  users, 
  organizations, 
  organizationMembers, 
  projects, 
  projectMembers, 
  tasks, 
  subtasks, 
  comments,
  roleEnum,
  taskStatusEnum,
  priorityEnum,
  taskTypeEnum,
  commentTypeEnum,
  projectStatusEnum,
  projectVisibilityEnum
} from "@/lib/db/schema";

/**
 * Seed the database with sample data for development
 */
export async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Check if database already has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already has data. Skipping seed.");
      return;
    }
    
    // Create users
    console.log("Creating users...");
    // Using plain text password for development since that's what the auth system expects
    const password = "password123";
    
    const [adminUser] = await db.insert(users).values({
      name: "Admin User",
      email: "admin@example.com",
      password: password,
      isAdmin: true,
      status: "active",
      jobTitle: "System Administrator",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [user1] = await db.insert(users).values({
      name: "John Doe",
      email: "john@example.com",
      password: password,
      isAdmin: false,
      status: "active",
      jobTitle: "Project Manager",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [user2] = await db.insert(users).values({
      name: "Jane Smith",
      email: "jane@example.com",
      password: password,
      isAdmin: false,
      status: "active",
      jobTitle: "Developer",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [user3] = await db.insert(users).values({
      name: "Bob Johnson",
      email: "bob@example.com",
      password: password,
      isAdmin: false,
      status: "active",
      jobTitle: "Designer",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Create organizations
    console.log("Creating organizations...");
    const [org1] = await db.insert(organizations).values({
      name: "Acme Inc",
      slug: "acme-inc",
      description: "A sample organization for development",
      visibility: "private",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [org2] = await db.insert(organizations).values({
      name: "Tech Solutions",
      slug: "tech-solutions",
      description: "Another sample organization",
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Add users to organizations
    console.log("Adding users to organizations...");
    await db.insert(organizationMembers).values([
      {
        userId: adminUser.id,
        organizationId: org1.id,
        role: "owner",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user1.id,
        organizationId: org1.id,
        role: "admin",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user2.id,
        organizationId: org1.id,
        role: "member",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user3.id,
        organizationId: org1.id,
        role: "member",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: adminUser.id,
        organizationId: org2.id,
        role: "member",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user1.id,
        organizationId: org2.id,
        role: "owner",
        joinedAt: new Date(),
        createdAt: new Date()
      }
    ]);
    
    // Create projects
    console.log("Creating projects...");
    const [project1] = await db.insert(projects).values({
      name: "Website Redesign",
      slug: "website-redesign",
      description: "Redesign the company website with modern UI/UX",
      status: "active",
      visibility: "private",
      organizationId: org1.id,
      ownerId: user1.id,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [project2] = await db.insert(projects).values({
      name: "Mobile App Development",
      slug: "mobile-app",
      description: "Develop a new mobile app for customers",
      status: "planning",
      visibility: "private",
      organizationId: org1.id,
      ownerId: user1.id,
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [project3] = await db.insert(projects).values({
      name: "Marketing Campaign",
      slug: "marketing-campaign",
      description: "Q4 marketing campaign planning and execution",
      status: "active",
      visibility: "team_only",
      organizationId: org2.id,
      ownerId: user1.id,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Add users to projects
    console.log("Adding users to projects...");
    await db.insert(projectMembers).values([
      {
        userId: user1.id,
        projectId: project1.id,
        role: "owner",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user2.id,
        projectId: project1.id,
        role: "member",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user3.id,
        projectId: project1.id,
        role: "member",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user1.id,
        projectId: project2.id,
        role: "owner",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user2.id,
        projectId: project2.id,
        role: "member",
        joinedAt: new Date(),
        createdAt: new Date()
      },
      {
        userId: user1.id,
        projectId: project3.id,
        role: "owner",
        joinedAt: new Date(),
        createdAt: new Date()
      }
    ]);
    
    // Create tasks for Website Redesign project
    console.log("Creating tasks for Website Redesign project...");
    const [task1] = await db.insert(tasks).values({
      title: "Design homepage mockup",
      description: "Create a mockup of the new homepage design",
      status: "in_progress",
      priority: "high",
      type: "task",
      projectId: project1.id,
      assigneeId: user3.id,
      reporterId: user1.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      estimatedHours: 16,
      position: 0,
      createdBy: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [task2] = await db.insert(tasks).values({
      title: "Implement homepage design",
      description: "Implement the approved homepage design with HTML/CSS/JS",
      status: "todo",
      priority: "medium",
      type: "task",
      projectId: project1.id,
      assigneeId: user2.id,
      reporterId: user1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      estimatedHours: 24,
      position: 0,
      createdBy: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [task3] = await db.insert(tasks).values({
      title: "Setup CI/CD pipeline",
      description: "Configure continuous integration and deployment pipeline",
      status: "todo",
      priority: "high",
      type: "task",
      projectId: project1.id,
      assigneeId: user2.id,
      reporterId: user1.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      estimatedHours: 8,
      position: 1,
      createdBy: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [task4] = await db.insert(tasks).values({
      title: "Content migration",
      description: "Migrate content from old website to new website",
      status: "backlog",
      priority: "low",
      type: "task",
      projectId: project1.id,
      reporterId: user1.id,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      estimatedHours: 16,
      position: 0,
      createdBy: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const [task5] = await db.insert(tasks).values({
      title: "SEO optimization",
      description: "Optimize the website for search engines",
      status: "backlog",
      priority: "medium",
      type: "task",
      projectId: project1.id,
      reporterId: user1.id,
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      estimatedHours: 8,
      position: 1,
      createdBy: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Create tasks for Mobile App project
    console.log("Creating tasks for Mobile App project...");
    await db.insert(tasks).values([
      {
        title: "Define app requirements",
        description: "Document the requirements for the mobile app",
        status: "todo",
        priority: "high",
        type: "task",
        projectId: project2.id,
        assigneeId: user1.id,
        reporterId: user1.id,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        estimatedHours: 16,
        position: 0,
        createdBy: user1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Design UI/UX",
        description: "Create user interface and experience design",
        status: "backlog",
        priority: "high",
        type: "task",
        projectId: project2.id,
        assigneeId: user3.id,
        reporterId: user1.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        estimatedHours: 40,
        position: 0,
        createdBy: user1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Setup development environment",
        description: "Configure development environment for mobile app",
        status: "todo",
        priority: "medium",
        type: "task",
        projectId: project2.id,
        assigneeId: user2.id,
        reporterId: user1.id,
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        estimatedHours: 8,
        position: 1,
        createdBy: user1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create subtasks
    console.log("Creating subtasks...");
    await db.insert(subtasks).values([
      {
        title: "Create wireframes",
        description: "Create wireframes for homepage design",
        completed: true,
        taskId: task1.id,
        assigneeId: user3.id,
        position: 0,
        createdBy: user1.id,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        title: "Create high-fidelity design",
        description: "Create high-fidelity design based on approved wireframes",
        completed: false,
        taskId: task1.id,
        assigneeId: user3.id,
        position: 1,
        createdBy: user1.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        title: "Get design approval",
        description: "Get approval for the homepage design",
        completed: false,
        taskId: task1.id,
        assigneeId: user3.id,
        position: 2,
        createdBy: user1.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        title: "Setup HTML structure",
        description: "Create the HTML structure for the homepage",
        completed: false,
        taskId: task2.id,
        assigneeId: user2.id,
        position: 0,
        createdBy: user1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Implement CSS styles",
        description: "Implement CSS styles for the homepage",
        completed: false,
        taskId: task2.id,
        assigneeId: user2.id,
        position: 1,
        createdBy: user1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create comments
    console.log("Creating comments...");
    const [comment1] = await db.insert(comments).values({
      content: "I've started working on the wireframes. Will share the first draft by tomorrow.",
      type: "text",
      taskId: task1.id,
      userId: user3.id,
      edited: false,
      isResolved: false,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
    }).returning();
    
    const [comment2] = await db.insert(comments).values({
      content: "Wireframes look good! I have a few suggestions for the navigation.",
      type: "text",
      taskId: task1.id,
      userId: user1.id,
      edited: false,
      isResolved: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }).returning();
    
    // Create comment replies
    await db.insert(comments).values([
      {
        content: "Thanks for the feedback! I'll incorporate your suggestions.",
        type: "text",
        taskId: task1.id,
        userId: user3.id,
        parentId: comment2.id,
        edited: false,
        isResolved: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 3 days ago + 2 hours
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) // 3 days ago + 2 hours
      },
      {
        content: "I've added a code snippet for the CI/CD pipeline configuration:",
        type: "code",
        taskId: task3.id,
        userId: user2.id,
        edited: false,
        isResolved: false,
        metadata: JSON.stringify({ language: "yaml" }),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ]);
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
} 