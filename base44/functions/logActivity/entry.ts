import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { event, data, old_data } = body;

  if (!data && event.type !== "delete") {
    return Response.json({ ok: true, skipped: true });
  }

  const projectId = data?.project_id || old_data?.project_id;
  if (!projectId) {
    return Response.json({ ok: true, skipped: true });
  }

  let action = "updated_task";
  let details = "";

  if (event.type === "create") {
    action = "created_task";
  } else if (event.type === "delete") {
    action = "deleted_task";
  } else if (event.type === "update" && old_data) {
    if (old_data.column !== data.column) {
      action = "moved_task";
      const colNames = { backlog: "Backlog", todo: "To Do", in_progress: "In Progress", review: "Review", done: "Done" };
      details = `from ${colNames[old_data.column] || old_data.column} to ${colNames[data.column] || data.column}`;
    } else if (data.attachments?.length > (old_data.attachments?.length || 0)) {
      action = "uploaded_file";
    }
  }

  await base44.asServiceRole.entities.ActivityLog.create({
    project_id: projectId,
    action,
    task_title: data?.title || old_data?.title || "Unknown",
    user_email: data?.created_by || old_data?.created_by || "",
    user_name: data?.assignee_name || "",
    details,
  });

  return Response.json({ ok: true });
});