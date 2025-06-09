export interface Subtask {
    id: string
    title: string
    description?: string
    completed: boolean
    assignee: string
    createdAt: Date
  }
  
  export interface Comment {
    id: string
    author: string
    content: string
    createdAt: Date
    avatar?: string
  }
  