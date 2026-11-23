/* Task enumerations shared by server and client code (docs/specs/02-data-model.md, tasks). */
export const TASK_STATUSES = ["todo", "in_progress", "blocked", "in_review", "done"] as const;
export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const STATUS_LABEL: Record<(typeof TASK_STATUSES)[number], string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  done: "Done",
};
