"use client";
import { useActionState, useRef } from "react";
import { createTaskAction, createWorkspaceAction, type FormState } from "@/app/actions";
import { TASK_PRIORITIES } from "@/server/task-options";

const input = "w-full rounded border border-control bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-focus";
const button = "rounded bg-action px-4 py-2 font-medium text-on-action hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-60";

function FormError({ state }: { state: FormState }) {
  return <p role="alert" className="text-sm text-danger">{state?.error ?? ""}</p>;
}

export function NewWorkspaceForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createWorkspaceAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="org_id" value={orgId} />
      <label className="flex-1 text-sm">
        Workspace name
        <input name="name" required maxLength={120} className={input} />
      </label>
      <button className={button} disabled={pending}>Create workspace</button>
      <FormError state={state} />
    </form>
  );
}

export function NewTaskForm({ orgId, workspaceId }: { orgId: string; workspaceId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await createTaskAction(prev, fd);
    if (!r?.error) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <label className="text-sm sm:col-span-2">
        Title
        <input name="title" required maxLength={200} className={input} />
      </label>
      <label className="text-sm sm:col-span-2">
        Description <span className="text-muted">(optional)</span>
        <textarea name="description" maxLength={5000} rows={2} className={input} />
      </label>
      <label className="text-sm">
        Priority
        <select name="priority" defaultValue="normal" className={input}>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="text-sm">
        Due date <span className="text-muted">(optional)</span>
        <input type="date" name="due_date" className={input} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="assign_to_me" /> Assign to me
      </label>
      <div className="flex items-center gap-3">
        <button className={button} disabled={pending}>Add task</button>
        <FormError state={state} />
      </div>
    </form>
  );
}
