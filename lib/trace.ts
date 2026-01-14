import { z } from "zod";

export const Frameworks = ["LANGCHAIN", "LANGGRAPH", "CREWAI", "OTHER"] as const;
export const RunStatuses = ["RUNNING", "SUCCESS", "FAILED"] as const;
export const StepStatuses = ["PENDING", "RUNNING", "SUCCESS", "FAILED"] as const;
export const StepKinds = ["THOUGHT", "ACTION", "TOOL", "OBSERVATION"] as const;
export const ToolStatuses = ["RUNNING", "SUCCESS", "FAILED"] as const;

export const toolCallSchema = z.object({
  name: z.string(),
  input: z.any().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
  status: z.enum(ToolStatuses).optional(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
});

export const stepSchema = z.object({
  index: z.number().int().nonnegative(),
  name: z.string().optional(),
  kind: z.enum(StepKinds).optional(),
  input: z.any().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
  status: z.enum(StepStatuses).optional(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  toolCalls: z.array(toolCallSchema).optional(),
});

export const runPayloadSchema = z.object({
  name: z.string().optional(),
  framework: z.enum(Frameworks).default("OTHER"),
  status: z.enum(RunStatuses).default("RUNNING"),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
  steps: z.array(stepSchema).default([]),
});

export type RunPayload = z.infer<typeof runPayloadSchema>;
