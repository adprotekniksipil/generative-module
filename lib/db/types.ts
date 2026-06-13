// Firestore document types — menggantikan Prisma generated types

export interface User {
  id: string;
  name: string;
  email: string;
  nim?: string | null;
  role: "DOSEN" | "MAHASISWA";
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  joinedAt: string;
}

export interface Topic {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubTopic {
  id: string;
  slug: string;
  label: string;
  topicId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  language: string;
  difficulty: string;
  depth: string;
  content: string;
  summary?: string | null;
  objectives?: string | null;
  sourceType: string;
  sourceContent?: string | null;
  sourceUrl?: string | null;
  createdById?: string | null;
  isPublished: boolean;
  wordCount: number;
  modelUsed: string;
  tokensUsed: number;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialAttachment {
  id: string;
  materialId: string;
  sectionIndex: number;
  sectionHeading: string;
  filename: string;
  storedName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  language: string;
  difficulty: string;
  examType: string;
  safeMode: boolean;
  questionCount: number;
  questionType: string;
  essayGradingMode: string;
  questions: string;
  createdById?: string | null;
  isPublished: boolean;
  totalPoints: number;
  modelUsed: string;
  tokensUsed: number;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: string;
  score: number;
  totalPoints: number;
  essayGrades?: string | null;
  startedAt: string;
  completedAt?: string | null;
  violationCount: number;
  lockedAt?: string | null;
}

export interface RPS {
  id: string;
  title: string;
  courseName: string;
  courseCode?: string | null;
  credits: number;
  semester: number;
  semesterType: string;
  academicYear: string;
  prerequisite?: string | null;
  program: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  description: string;
  cpl: string;
  cpmk: string;
  assessmentScheme?: string | null;
  references?: string | null;
  weeks: string;
  topic: string;
  subTopic: string;
  language: string;
  modelUsed: string;
  tokensUsed: number;
  createdById?: string | null;
  isPublished: boolean;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GradeMatrix {
  id: string;
  title: string;
  description?: string | null;
  createdById?: string | null;
  groupId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradeComponent {
  id: string;
  gradeMatrixId: string;
  name: string;
  percentage: number;
  order: number;
}

export interface GradeStudent {
  id: string;
  gradeMatrixId: string;
  name: string;
  nim?: string | null;
  order: number;
}

export interface GradeScore {
  id: string;
  componentId: string;
  studentId: string;
  score?: number | null;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface AiUsageLog {
  id: string;
  userId?: string | null;
  action: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  metadata?: string | null;
  createdAt: string;
}
