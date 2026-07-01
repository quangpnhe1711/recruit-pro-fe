import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import {
  ACTION_TYPES,
  CONDITION_OPERATORS,
  RECIPIENT_SELECTORS,
  TRIGGER_EVENT_TYPES,
  type WorkflowDetailDto,
  type WorkflowMode,
} from "../../modules/system-admin/automationSchema";
import { createWorkflow, updateWorkflow } from "../../services/system-admin/automationService";
import { actionLabel, eventLabel, OPERATOR_LABELS, RECIPIENT_LABELS } from "./automationUi";

type EditableCondition = { field: string; operator: string; value: string };
type EditableAction = {
  type: string;
  recipients: string[];
  roles: string;
  title: string;
  body: string;
  cooldownHours: string;
};

function actionToEditable(type: string, configJson: string): EditableAction {
  let cfg: Record<string, unknown> = {};
  try {
    cfg = JSON.parse(configJson || "{}");
  } catch {
    /* ignore */
  }
  return {
    type,
    recipients: Array.isArray(cfg.recipients) ? (cfg.recipients as string[]) : [],
    roles: Array.isArray(cfg.roles) ? (cfg.roles as string[]).join(", ") : "",
    title: typeof cfg.title === "string" ? cfg.title : "",
    body: typeof cfg.body === "string" ? cfg.body : "",
    cooldownHours: cfg.cooldownHours != null ? String(cfg.cooldownHours) : "",
  };
}

function editableToConfigJson(a: EditableAction): string {
  const cfg: Record<string, unknown> = {};
  if (a.recipients.length) cfg.recipients = a.recipients;
  if (a.roles.trim()) cfg.roles = a.roles.split(",").map((r) => r.trim()).filter(Boolean);
  if (a.title.trim()) cfg.title = a.title.trim();
  if (a.body.trim()) cfg.body = a.body.trim();
  if (a.cooldownHours.trim()) cfg.cooldownHours = Number(a.cooldownHours) || 0;
  return JSON.stringify(cfg);
}

export default function WorkflowEditor({
  mode,
  workflow,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  workflow?: WorkflowDetailDto;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const source = workflow?.activeVersion ?? workflow?.versions?.[0] ?? null;
  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [trigger, setTrigger] = useState(source?.triggerEventType ?? TRIGGER_EVENT_TYPES[0]);
  const [runMode, setRunMode] = useState<WorkflowMode>(source?.mode ?? "Shadow");
  const [conditions, setConditions] = useState<EditableCondition[]>(
    (source?.conditions ?? []).map((c) => ({ field: c.field, operator: c.operator, value: c.value ?? "" })),
  );
  const [actions, setActions] = useState<EditableAction[]>(
    (source?.actions ?? [{ type: "notify_user", configJson: "{}" }]).map((a) => actionToEditable(a.type, a.configJson)),
  );
  const [busy, setBusy] = useState(false);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!name.trim()) e.push("Tên workflow là bắt buộc.");
    if (!TRIGGER_EVENT_TYPES.includes(trigger as (typeof TRIGGER_EVENT_TYPES)[number])) e.push("Trigger không hợp lệ.");
    if (actions.length === 0) e.push("Cần ít nhất một hành động.");
    conditions.forEach((c, i) => {
      if (!c.field.trim()) e.push(`Điều kiện #${i + 1} thiếu tên trường.`);
    });
    return e;
  }, [name, trigger, actions, conditions]);

  const valid = errors.length === 0;

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      triggerEventType: trigger,
      mode: runMode,
      conditions: conditions.map((c) => ({ field: c.field.trim(), operator: c.operator, value: c.value })),
      actions: actions.map((a) => ({ type: a.type, configJson: editableToConfigJson(a) })),
    };
    try {
      const result = mode === "create" ? await createWorkflow(payload) : await updateWorkflow(workflow!.id, payload);
      toast.success(mode === "create" ? "Đã tạo workflow (bản nháp)." : "Đã lưu bản nháp workflow.");
      onSaved(result.id);
    } catch {
      toast.error("Không thể lưu workflow. Kiểm tra lại cấu hình.");
    } finally {
      setBusy(false);
    }
  };

  const preview = `Khi "${eventLabel(trigger)}"${
    conditions.length ? `, nếu ${conditions.map((c) => `${c.field} ${OPERATOR_LABELS[c.operator] ?? c.operator} ${c.value}`).join(" và ")}` : ""
  }, thì ${actions.map((a) => actionLabel(a.type)).join(", ") || "(chưa có hành động)"}.`;

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#1a1c1c]/45 p-4 backdrop-blur-[2px]">
      <div className="animate-scale-in my-6 w-full max-w-2xl rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_32px_80px_-16px_rgba(26,28,28,0.3)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-[18px] font-semibold text-[#1a1c1c]">
            {mode === "create" ? "Tạo workflow" : "Sửa bản nháp workflow"}
          </h3>
          <button type="button" className="premium-action text-[#8a8786]" onClick={onClose} aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="field-label">Tên workflow</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Pass CV → Notify Head Review" />
          </div>
          <div>
            <label className="field-label">Mô tả</label>
            <textarea className="input-field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Trigger (sự kiện)</label>
              <CommonSelect
                value={trigger}
                onValueChange={setTrigger}
                options={TRIGGER_EVENT_TYPES.map((t) => ({ label: eventLabel(t), value: t }))}
              />
            </div>
            <div>
              <label className="field-label">Chế độ chạy</label>
              <CommonSelect
                value={runMode}
                onValueChange={(v) => setRunMode(v as WorkflowMode)}
                options={[
                  { label: "Shadow (chỉ ghi log)", value: "Shadow" },
                  { label: "Live (gửi thật)", value: "Live" },
                  { label: "Disabled (tắt)", value: "Disabled" },
                ]}
              />
            </div>
          </div>

          {runMode === "Live" ? (
            <p className="rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              Chế độ Live sẽ gửi thông báo thật. Hãy kiểm tra kỹ trước khi xuất bản.
            </p>
          ) : null}

          {/* Conditions */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="field-label mb-0">Điều kiện</label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConditions((c) => [...c, { field: "", operator: "exists", value: "" }])}
              >
                + Thêm điều kiện
              </button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-[13px] text-[#8a8786]">Không có điều kiện — workflow luôn chạy khi có trigger.</p>
            ) : (
              <div className="space-y-2">
                {conditions.map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <input className="input-field" placeholder="trường (vd: finalScore)" value={c.field} onChange={(e) => setConditions((arr) => arr.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} />
                    <CommonSelect value={c.operator} onValueChange={(v) => setConditions((arr) => arr.map((x, j) => (j === i ? { ...x, operator: v } : x)))} options={CONDITION_OPERATORS.map((o) => ({ label: OPERATOR_LABELS[o] ?? o, value: o }))} />
                    <input className="input-field" placeholder="giá trị" value={c.value} onChange={(e) => setConditions((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <button type="button" className="premium-action text-[#b90014]" aria-label="Xóa điều kiện" onClick={() => setConditions((arr) => arr.filter((_, j) => j !== i))}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="field-label mb-0">Hành động</label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setActions((a) => [...a, actionToEditable("notify_user", "{}")])}
              >
                + Thêm hành động
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((a, i) => (
                <div key={i} className="rounded-[12px] border border-[#eee9e7] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CommonSelect
                      wrapperClassName="flex-1"
                      value={a.type}
                      onValueChange={(v) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, type: v } : x)))}
                      options={ACTION_TYPES.map((t) => ({ label: actionLabel(t), value: t }))}
                    />
                    <button type="button" className="premium-action text-[#b90014]" aria-label="Xóa hành động" onClick={() => setActions((arr) => arr.filter((_, j) => j !== i))}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {a.type === "notify_role" ? (
                    <input className="input-field mb-2" placeholder="Vai trò (VD: HR, Manager)" value={a.roles} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, roles: e.target.value } : x)))} />
                  ) : (
                    <div className="mb-2 flex flex-wrap gap-3">
                      {RECIPIENT_SELECTORS.map((sel) => (
                        <label key={sel} className="flex items-center gap-1.5 text-[13px] text-[#3a3a3a]">
                          <input
                            type="checkbox"
                            checked={a.recipients.includes(sel)}
                            onChange={(e) =>
                              setActions((arr) =>
                                arr.map((x, j) =>
                                  j === i
                                    ? { ...x, recipients: e.target.checked ? [...x.recipients, sel] : x.recipients.filter((r) => r !== sel) }
                                    : x,
                                ),
                              )
                            }
                          />
                          {RECIPIENT_LABELS[sel]}
                        </label>
                      ))}
                    </div>
                  )}

                  <input className="input-field mb-2" placeholder="Tiêu đề thông báo" value={a.title} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <input className="input-field" placeholder="Nội dung thông báo" value={a.body} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
                  {a.type === "send_reminder" ? (
                    <input className="input-field mt-2" type="number" placeholder="Cooldown (giờ)" value={a.cooldownHours} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, cooldownHours: e.target.value } : x)))} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] bg-[#fbfaf9] px-3 py-2.5 text-[13px] text-[#3a3a3a]">
            <span className="font-semibold">Xem trước: </span>
            {preview}
          </div>

          {!valid ? (
            <ul className="rounded-[10px] bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !valid} data-testid="save-workflow">
            {busy ? "Đang lưu..." : "Lưu bản nháp"}
          </button>
        </div>
      </div>
    </div>
  );
}
