import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingIndicator from "../../common/components/LoadingIndicator";

import type { JobStatus, ManagerJobApprovalDetailDto } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

function formatDateLabel(value: string | null) {
  if (!value) return "Chưa cung cấp";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoneyRange(min: number | null, max: number | null) {
  if (min == null && max == null) return "Chưa xác định";

  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  if (min != null && max != null) {
    return `${formatter.format(min)} - ${formatter.format(max)} / năm`;
  }

  if (min != null) {
    return `${formatter.format(min)}+ / năm`;
  }

  return `Tối đa ${formatter.format(max ?? 0)} / năm`;
}

function toneForSkill(required: boolean) {
  return required
    ? "bg-[#b90014]/5 text-[#b90014] border-[#e7bdb8]"
    : "bg-[#f3f3f3] text-[#1a1c1c] border-[#e2dfde]";
}

function actionStyles(action: "approve" | "changes" | "reject") {
  switch (action) {
    case "approve":
      return "bg-[#1a1c1c] text-white hover:bg-[#2f3131]";
    case "changes":
      return "border border-[#1a1c1c] bg-white text-[#1a1c1c] hover:bg-[#f3f3f3]";
    case "reject":
      return "bg-[#b90014] text-white hover:bg-[#93000d]";
  }
}

function ManagerJobApprovalDetailScreen() {
  const navigate = useNavigate();
  const { jobId = "" } = useParams();
  const [detail, setDetail] = useState<ManagerJobApprovalDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<JobStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);

      try {
        const response = await jobsService.getManagerApprovalDetail(jobId);

        if (!mounted) return;
        setDetail(response.data ?? null);
      } catch {
        if (!mounted) return;
        setDetail(null);
        toast.error("Không thể tải chi tiết phê duyệt job.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  const statusText = useMemo(() => {
    if (!detail) return "";
    return detail.status === "PendingApproval" ? "Chờ duyệt" : detail.statusLabel;
  }, [detail]);

  async function submitDecision(nextStatus: JobStatus, successMessage: string) {
    if (!detail) return;

    setSubmitting(nextStatus);

    try {
      await jobsService.updateJobStatus(detail.jobId, { status: nextStatus });
      toast.success(successMessage);
      navigate("/jobs");
    } catch {
      toast.error("Không thể cập nhật trạng thái phê duyệt job.");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-8 md:px-10">
        <LoadingIndicator label="Đang tải bản nháp phê duyệt..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="w-full px-4 py-8 md:px-10">
        <div className="border border-[#e7bdb8] bg-white p-8">
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Không tìm thấy bản nháp phê duyệt
          </h1>
          <p className="mt-2 text-sm text-[#5f5e5e]">
            Không thể tải job đã chọn từ luồng phê duyệt hiện tại.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 bg-[#1a1c1c] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => navigate("/jobs")}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại hàng chờ duyệt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#cde5ff] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#004b74]">
              {detail.referenceCode}
            </span>
            <span className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
              {detail.submittedAgoLabel}
            </span>
            <span className="rounded-full bg-[#f3f3f3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a1c1c]">
              {statusText}
            </span>
          </div>
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            {detail.title}
          </h1>
          <p className="mt-2 text-[16px] leading-6 text-[#5f5e5e]">
            Được gửi bởi <span className="font-bold text-[#1a1c1c]">{detail.hrOwner.fullName} (HR)</span> cho {detail.department.name}.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
          onClick={() => navigate("/jobs")}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại hàng chờ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 lg:col-span-8 md:grid-cols-2">
          <section className="col-span-2 rounded-lg border border-[#e7bdb8] bg-white p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-[#e8e8e8] pb-4">
              <span className="material-symbols-outlined text-[#b90014]">info</span>
              <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Thông số chính</h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Phòng ban</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1a1c1c]">{detail.department.name}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Địa điểm</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1a1c1c]">{detail.location} ({detail.workMode})</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Mức lương</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1a1c1c]">{formatMoneyRange(detail.salaryMin, detail.salaryMax)}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Loại hình</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1a1c1c]">{detail.employmentType}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Số lượng tuyển</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1a1c1c]">{detail.vacancyCount}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Hạn nộp</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1a1c1c]">{formatDateLabel(detail.deadline)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#e7bdb8] bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">terminal</span>
              <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Công nghệ / Kỹ năng</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.skills.length ? detail.skills.map((skill) => (
                <span
                  key={skill.skillId}
                  className={`rounded border px-2 py-1 text-[12px] font-semibold ${toneForSkill(skill.isRequired)}`}
                >
                  {skill.name}
                </span>
              )) : (
                <p className="text-sm text-[#5f5e5e]">Chưa cấu hình kỹ năng cho job này.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[#e7bdb8] bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">schema</span>
              <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Luồng phỏng vấn</h2>
            </div>
            <ol className="space-y-3">
              {detail.interviewFlow.map((step) => (
                <li key={step.order} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-[12px] font-bold text-white">
                    {step.order}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">{step.label}</p>
                    <p className="text-[12px] leading-5 text-[#5f5e5e]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="col-span-2 rounded-lg border border-[#e7bdb8] bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">description</span>
              <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Tổng quan vị trí</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Mô tả</p>
                <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.description.length ? detail.description.map((item) => <li key={item}>• {item}</li>) : <li>Chưa có mô tả.</li>}
                </ul>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Yêu cầu</p>
                <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.requirements.length ? detail.requirements.map((item) => <li key={item}>• {item}</li>) : <li>Chưa có yêu cầu.</li>}
                </ul>
              </div>
            </div>
            <div className="mt-6 border-t border-[#e8e8e8] pt-6">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Quyền lợi</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.benefits.length ? detail.benefits.map((item) => (
                  <span key={item} className="rounded-full bg-[#f3f3f3] px-3 py-1.5 text-[12px] font-semibold text-[#1a1c1c]">
                    {item}
                  </span>
                )) : (
                  <span className="text-sm text-[#5f5e5e]">Chưa cấu hình quyền lợi.</span>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-lg border-2 border-[#5d3f3c] bg-white p-6">
            <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
              Hành động phê duyệt
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5d3f3c]">
              Khi quản lý phê duyệt, job sẽ đi tiếp trong luồng đăng tuyển. Yêu cầu chỉnh sửa sẽ trả bản nháp về cho HR cập nhật.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("approve")}`}
                disabled={submitting !== null}
                onClick={() => void submitDecision("APPROVED", "Job đã được duyệt và sẵn sàng cho bước đăng tuyển.")}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">check_circle</span>
                  Duyệt job
                </span>
                <span>{submitting === "APPROVED" ? "Đang lưu..." : "Sang bước đăng tuyển"}</span>
              </button>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("changes")}`}
                disabled={submitting !== null}
                onClick={() => void submitDecision("DRAFT", "Job đã được trả về bản nháp để HR chỉnh sửa.")}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">edit_note</span>
                  Yêu cầu chỉnh sửa
                </span>
                <span>{submitting === "DRAFT" ? "Đang lưu..." : "Trả về nháp"}</span>
              </button>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("reject")}`}
                disabled={submitting !== null}
                onClick={() => void submitDecision("REJECTED", "Job đã bị từ chối trong luồng phê duyệt.")}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">cancel</span>
                  Từ chối job
                </span>
                <span>{submitting === "REJECTED" ? "Đang lưu..." : "Kết thúc duyệt"}</span>
              </button>
            </div>

            <div className="mt-6 border-t border-[#e7bdb8] pt-6">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Tóm tắt phê duyệt</p>
              <p className="mt-3 text-sm leading-6 text-[#1a1c1c]">{detail.approvalSnapshot?.summary ?? "Chưa có dữ liệu tóm tắt phê duyệt."}</p>
              {detail.approvalSnapshot?.approvedByName ? (
                <p className="mt-2 text-[12px] font-semibold text-[#5f5e5e]">
                  Người duyệt gần nhất: {detail.approvalSnapshot.approvedByName}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg bg-[#1a1a1a] p-6 text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">Ngữ cảnh phê duyệt</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[28px] font-semibold leading-8">{detail.insights.applicationsCount}</p>
                <p className="mt-1 text-[12px] text-white/70">Hồ sơ ứng tuyển</p>
              </div>
              <div>
                <p className="text-[28px] font-semibold leading-8">{detail.insights.activePipelineCount}</p>
                <p className="mt-1 text-[12px] text-white/70">Pipeline đang chạy</p>
              </div>
              <div>
                <p className="text-[28px] font-semibold leading-8">{detail.insights.requiredSkillsCount}</p>
                <p className="mt-1 text-[12px] text-white/70">Kỹ năng yêu cầu</p>
              </div>
              <div>
                <p className="text-[28px] font-semibold leading-8">{detail.minExperienceYears ?? 0}y</p>
                <p className="mt-1 text-[12px] text-white/70">Kinh nghiệm tối thiểu</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#e7bdb8] bg-white p-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">HR phụ trách</p>
            <p className="mt-3 text-[20px] font-semibold text-[#1a1c1c]">{detail.hrOwner.fullName}</p>
            <p className="mt-1 text-sm text-[#5f5e5e]">{detail.hrOwner.email}</p>
            <p className="mt-1 text-sm text-[#5f5e5e]">{detail.hrOwner.phone || "Chưa có số điện thoại"}</p>
            <div className="mt-6 border-t border-[#e8e8e8] pt-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Bối cảnh phòng ban</p>
              <p className="mt-2 text-sm leading-6 text-[#1a1c1c]">{detail.department.description || "Hiện chưa có mô tả phòng ban trong bộ dữ liệu seed."}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerJobApprovalDetailScreen;
