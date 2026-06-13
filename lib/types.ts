export type SourceType = "topic" | "file" | "url";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Depth = "brief" | "standard" | "comprehensive";
export type Language = "id" | "en";
export type QuestionType = "multiple_choice" | "essay" | "true_false" | "mixed";
export type ExamType = "Quiz" | "UTS" | "UAS";

export interface GenerateMaterialInput {
  topic: string;
  subTopic: string;
  difficulty: Difficulty;
  depth: Depth;
  language: Language;
  customInstructions?: string;
  // For upload/transform
  sourceType: SourceType;
  sourceContent?: string;
  sourceUrl?: string;
}

export interface GenerateQuizInput {
  topic: string;
  subTopic: string;
  difficulty: Difficulty;
  language: Language;
  questionCount: number;
  questionType: QuestionType;
  customInstructions?: string;
}

export interface QuizQuestion {
  number: number;
  type: "multiple_choice" | "essay" | "true_false";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  bloomLevel?: string;
}

export interface ParsedContent {
  text: string;
  title?: string;
  wordCount: number;
}

// ─── RPS Types ───────────────────────────────────────────

export interface GenerateRPSInput {
  courseName: string;
  courseCode?: string;
  credits: number;
  semester: number;
  semesterType: "Ganjil" | "Genap";
  academicYear: string;
  prerequisite?: string;
  program: string;
  topic: string;
  subTopic: string;
  language: Language;
  weekCount: number; // 14 or 16
  customInstructions?: string;
}

export interface RPSWeek {
  weekNumber: number;
  topic: string;
  finalAbility: string;
  method: string;
  timeAllocation: number; // menit
  learningExperience: string;
  criteria: string;
  weight: number; // %
  isExam: boolean;
  examType?: "UTS" | "UAS";
}

export interface RPSAssessmentScheme {
  component: string;
  weight: number;
  description: string;
}

export interface RPSData {
  title: string;
  description: string;
  cpl: string[];
  cpmk: string[];
  assessmentScheme: RPSAssessmentScheme[];
  references: string[];
  weeks: RPSWeek[];
  tokensUsed?: number;
}
