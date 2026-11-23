"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { createObjectiveAction, createTaskAction, createWorkspaceAction, type FormState } from "@/app/actions";
import { Button, controlClass, Field } from "@/components/ui";
import { PRIORITY_LABEL, TASK_PRIORITIES } from "@/server/task-options";

function FormMessage({ state }: { state: FormState }) {
  return (
    <p role="status" aria-live="polite" className={state?.error ? "text-sm text-danger" : "sr-only"}>
      {state?.error ?? (state?.ok ? "Saved" : "")}
    </p>
  );
}

/** Resets the form after each successful save. */
function useResetOnSuccess(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);
  return ref;
}

export function NewWorkspaceForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createWorkspaceAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <input type="hidden" name="org_id" value={orgId} />
      <Field label="Workspace name" className="flex-1">
        <input name="name" required maxLength={120} className={controlClass} placeholder="e.g. Coastal Tours — Summer" />
      </Field>
      <Button disabled={pending}>Create workspace</Button>
      <FormMessage state={state} />
    </form>
  );
}

export function NewTaskForm({ orgId, workspaceId, objectives }: { orgId: string; workspaceId: string; objectives: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(createTaskAction, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="grid gap-5 md:grid-cols-6">
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <Field label="Title" className="md:col-span-6">
        <input name="title" required maxLength={200} className={controlClass} />
      </Field>
      <Field label="Notes" optional className="md:col-span-6">
        <textarea name="description" maxLength={5000} rows={2} className={controlClass} />
      </Field>
      <Field label="Priority" className="md:col-span-2">
        <select name="priority" defaultValue="normal" className={controlClass}>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
      </Field>
      <Field label="Due date" optional className="md:col-span-2">
        <input type="date" name="due_date" className={controlClass} />
      </Field>
      <Field label="Objective" optional className="md:col-span-2">
        <select name="objective_id" defaultValue="" className={controlClass}>
          <option value="">None</option>
          {objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </Field>
      <label className="flex items-center gap-2 text-base md:col-span-3">
        <input type="checkbox" name="assign_to_me" className="size-4 accent-action" /> Assign to me
      </label>
      <div className="flex items-center justify-end gap-4 md:col-span-3">
        <FormMessage state={state} />
        <Button disabled={pending}>Add task</Button>
      </div>
    </form>
  );
}

export function NewObjectiveForm({ orgId, workspaceId }: { orgId: string; workspaceId: string }) {
  const [state, action, pending] = useActionState(createObjectiveAction, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="grid gap-5 md:grid-cols-6">
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <Field label="Objective" className="md:col-span-4">
        <input name="title" required maxLength={200} className={controlClass} placeholder="e.g. Fill 80% of summer departures" />
      </Field>
      <Field label="Target date" optional className="md:col-span-2">
        <input type="date" name="target_date" className={controlClass} />
      </Field>
      <div className="flex items-center justify-end gap-4 md:col-span-6">
        <FormMessage state={state} />
        <Button disabled={pending}>Add objective</Button>
      </div>
    </form>
  );
}

/** A status select that only shows its Save button once the value changes (no surprise submits). */
export function StatusSelect({ action, idName, id, value, options, label }: {
  action: (fd: FormData) => Promise<void>;
  idName: string;
  id: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const [current, setCurrent] = useState(value);
  const [saved, setSaved] = useState(value);
  if (saved !== value) {
    // the server's value changed (after a save): follow it
    setSaved(value);
    setCurrent(value);
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name={idName} value={id} />
      <label>
        <span className="sr-only">{label}</span>
        <select name="status" value={current} onChange={(e) => setCurrent(e.target.value)} className="min-h-8 rounded-sm border border-transparent bg-transparent px-1 text-sm text-ink hover:border-control focus-visible:border-control">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      {current !== value && <Button size="sm">Save</Button>}
    </form>
  );
}
