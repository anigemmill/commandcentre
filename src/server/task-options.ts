/* Enumerations shared by server and client code (docs/specs/02-data-model.md). */
export const TASK_STATUSES = ["todo", "in_progress", "blocked", "in_review", "done"] as const;
export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const OBJECTIVE_STATUSES = ["active", "achieved", "paused", "dropped"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  done: "Done",
};
export const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" };
export const OBJECTIVE_STATUS_LABEL: Record<ObjectiveStatus, string> = { active: "Active", achieved: "Achieved", paused: "Paused", dropped: "Dropped" };
