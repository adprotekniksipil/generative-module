import { z } from "zod";

export const quizQuestionSchema = z.object({
  number: z.number(),
  type: z.enum(["multiple_choice", "essay", "true_false"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  points: z.number(),
  bloomLevel: z.string().optional(),
});

export const quizOutputSchema = z.object({
  title: z.string(),
  questions: z.array(quizQuestionSchema),
});

export type QuizOutput = z.infer<typeof quizOutputSchema>;
