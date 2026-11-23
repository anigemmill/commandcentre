"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { devIdentityEnabled } from "@/server/auth/dev-issuer";
import { endSession, requirePrincipal, startDevSession } from "@/server/auth/session";
import { createObjective, createTask, createWorkspace, deleteTask, devPersonExists, setObjectiveStatus, setTaskStatus } from "@/server/data";

export type FormState = { error?: string; ok?: number } | undefined;
const Id = z.uuid();

export async function devSignIn(formData: FormData) {
  if (!devIdentityEnabled()) redirect("/sign-in");
  const id = Id.safeParse(formData.get("user_id"));
  if (!id.success || !(await devPersonExists(id.data))) redirect("/sign-in");
  await startDevSession(id.data);
  redirect("/orgs");
}

export async function signOut() {
  await endSession();
  redirect("/sign-in");
}

export async function createWorkspaceAction(_: FormState, formData: FormData): Promise<FormState> {
  const p = await requirePrincipal();
  const orgId = Id.safeParse(formData.get("org_id"));
  if (!orgId.success) return { error: "Organisation not found" };
  const r = await createWorkspace(p.userId, orgId.data, String(formData.get("name") ?? ""));
  if ("error" in r) return { error: r.error };
  redirect(`/orgs/${orgId.data}/w/${r.id}`);
}

export async function createTaskAction(_: FormState, formData: FormData): Promise<FormState> {
  const p = await requirePrincipal();
  const orgId = Id.safeParse(formData.get("org_id"));
  const workspaceId = Id.safeParse(formData.get("workspace_id"));
  if (!orgId.success || !workspaceId.success) return { error: "Workspace not found" };
  const r = await createTask(p.userId, orgId.data, workspaceId.data, {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    priority: String(formData.get("priority") ?? "normal") as "normal",
    due_date: String(formData.get("due_date") ?? ""),
    assign_to_me: formData.get("assign_to_me") === "on",
    objective_id: String(formData.get("objective_id") ?? ""),
  });
  if ("error" in r) return { error: r.error };
  revalidatePath(`/orgs/${orgId.data}`, "layout");
  return { ok: Date.now() };
}

export async function createObjectiveAction(_: FormState, formData: FormData): Promise<FormState> {
  const p = await requirePrincipal();
  const orgId = Id.safeParse(formData.get("org_id"));
  const workspaceId = Id.safeParse(formData.get("workspace_id"));
  if (!orgId.success || !workspaceId.success) return { error: "Workspace not found" };
  const r = await createObjective(p.userId, orgId.data, workspaceId.data, {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    target_date: String(formData.get("target_date") ?? ""),
  });
  if ("error" in r) return { error: r.error };
  revalidatePath(`/orgs/${orgId.data}`, "layout");
  return { ok: Date.now() };
}

export async function setObjectiveStatusAction(formData: FormData) {
  const p = await requirePrincipal();
  const id = Id.safeParse(formData.get("objective_id"));
  if (!id.success) return;
  await setObjectiveStatus(p.userId, id.data, String(formData.get("status") ?? ""));
  revalidatePath("/orgs", "layout");
}

export async function setTaskStatusAction(formData: FormData) {
  const p = await requirePrincipal();
  const taskId = Id.safeParse(formData.get("task_id"));
  if (!taskId.success) return;
  await setTaskStatus(p.userId, taskId.data, String(formData.get("status") ?? ""));
  revalidatePath("/orgs", "layout");
}

export async function deleteTaskAction(formData: FormData) {
  const p = await requirePrincipal();
  const taskId = Id.safeParse(formData.get("task_id"));
  if (!taskId.success) return;
  await deleteTask(p.userId, taskId.data);
  revalidatePath("/orgs", "layout");
}
