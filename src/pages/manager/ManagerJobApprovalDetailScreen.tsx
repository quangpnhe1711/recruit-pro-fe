import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import EmptyState from "../../common/components/EmptyState";
import { Skeleton } from "../../common/components/Skeleton";

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
    return `${formatter.format(min)} - ${formatter.format(max)} VNĐ / tháng`;
  }

  if (min != null) {
    return `${formatter.format(min)}+ VNĐ / tháng`;
  }

  return `Tối đa ${formatter.format(max ?? 0)} VNĐ / tháng`;
}

function toneForSkill(required: boolean) {
  return required
    ? "bg-[#fff1f0] text-[#b90014]"
    : "bg-[#f2efed] text-[#5f5e5e]";
}

function actionStyles(action: "approve" | "changes" | "reject") {
  switch (action) {
    case "approve":
      return "bg-[#1a1c1c] text-white hover:bg-[#2f3131]";
    case "changes":
      return "border border-[#ececec] bg-white text-[#1a1c1c] hover:bg-[#faf9f8]";
    case "reject":
      return "bg-gradient-to-r from-[#e8242c] to-[#b90014] text-white hover:brightness-105";
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
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="surface-card h-[480px] lg:col-span-8" />
          <div className="surface-card h-[480px] lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10">
          <EmptyState
            icon="search_off"
            title="Không tìm thấy bản nháp phê duyệt"
            description="Không thể tải job đã chọn từ luồng phê duyệt hiện tại."
            action={
              <button type="button" className="btn btn-dark" onClick={() => navigate("/jobs")}>
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Quay lại hàng chờ duyệt
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in py-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className="badge bg-sky-50 text-sky-700">{detail.referenceCode}</span>
            <span className="text-[12px] font-semibold text-[#5f5e5e]">{detail.submittedAgoLabel}</span>
            <span className="badge bg-[#f2efed] text-[#5f5e5e]">{statusText}</span>
          </div>
          <h1 className="page-title">{detail.title}</h1>
          <p className="page-subtitle">
            Được gửi bởi <span className="font-semibold text-[#1a1c1c]">{detail.hrOwner.fullName} (HR)</span> cho {detail.department.name}.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary shrink-0"
          onClick={() => navigate("/jobs")}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại hàng chờ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-6 lg:col-span-8 md:grid-cols-2">
          <section className="card col-span-1 p-6 md:col-span-2">
            <div className="mb-5 flex items-center gap-2 border-b border-[#f0eceb] pb-4">
              <span className="material-symbols-outlined text-[#b90014]">info</span>
              <h2 className="section-title">Thông số chính</h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Phòng ban</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.department.name}</p>
              </div>
              <div>
                <p className="eyebrow">Địa điểm</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.location} ({detail.workMode})</p>
              </div>
              <div>
                <p className="eyebrow">Mức lương</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{formatMoneyRange(detail.salaryMin, detail.salaryMax)}</p>
              </div>
              <div>
                <p className="eyebrow">Loại hình</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.employmentType}</p>
              </div>
              <div>
                <p className="eyebrow">Số lượng tuyển</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.vacancyCount}</p>
              </div>
              <div>
                <p className="eyebrow">Hạn nộp</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{formatDateLabel(detail.deadline)}</p>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">terminal</span>
              <h2 className="section-title">Công nghệ / Kỹ năng</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.skills.length ? detail.skills.map((skill) => (
                <span
                  key={skill.skillId}
                  className={`badge ${toneForSkill(skill.isRequired)}`}
                >
                  {skill.isRequired ? <span className="material-symbols-outlined text-[14px] leading-none">star</span> : null}
                  {skill.name}
                </span>
              )) : (
                <p className="text-[13px] text-[#5f5e5e]">Chưa cấu hình kỹ năng cho job này.</p>
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">schema</span>
              <h2 className="section-title">Luồng phỏng vấn</h2>
            </div>
            <ol className="space-y-4">
              {detail.interviewFlow.map((step) => (
                <li key={step.order} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1c1c] text-[12px] font-bold text-white">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">{step.label}</p>
                    <p className="text-[12px] leading-5 text-[#5f5e5e]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="card col-span-1 p-6 md:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">description</span>
              <h2 className="section-title">Tổng quan vị trí</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">Mô tả</p>
                <ul className="space-y-2.5 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.description.length ? detail.description.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#b90014]">chevron_right</span>
                      <span>{item}</span>
                    </li>
                  )) : <li>Chưa có mô tả.</li>}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">Yêu cầu</p>
                <ul className="space-y-2.5 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.requirements.length ? detail.requirements.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#b90014]">check_circle</span>
                      <span>{item}</span>
                    </li>
                  )) : <li>Chưa có yêu cầu.</li>}
                </ul>
              </div>
            </div>
            <div className="mt-6 border-t border-[#f0eceb] pt-6">
              <p className="eyebrow mb-3">Quyền lợi</p>
              <div className="flex flex-wrap gap-2">
                {detail.benefits.length ? detail.benefits.map((item) => (
                  <span key={item} className="badge bg-[#f2efed] text-[#5f5e5e]">
                    {item}
                  </span>
                )) : (
                  <span className="text-[13px] text-[#5f5e5e]">Chưa cấu hình quyền lợi.</span>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section className="card border-[#e7bdb8] p-6 lg:sticky lg:top-6">
            <h2 className="section-title text-[20px]">Hành động phê duyệt</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">
              Khi quản lý phê duyệt, job sẽ đi tiếp trong luồng đăng tuyển. Yêu cầu chỉnh sửa sẽ trả bản nháp về cho HR cập nhật.
            </p>

            <div className="mt-6 space-y-3">
              <AsyncActionButton
                type="button"
                className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("approve")}`}
                disabled={submitting !== null}
                loading={submitting === "APPROVED"}
                loadingText="Đang duyệt job..."
                onClick={() => submitDecision("APPROVED", "Job đã được duyệt và sẵn sàng cho bước đăng tuyển.")}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">check_circle</span>
                  Duyệt job
                </span>
                <span>Sang bước đăng tuyển</span>
              </AsyncActionButton>
              <AsyncActionButton
                type="button"
                className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("changes")}`}
                disabled={submitting !== null}
                loading={submitting === "DRAFT"}
                loadingText="Đang trả về nháp..."
                onClick={() => submitDecision("DRAFT", "Job đã được trả về bản nháp để HR chỉnh sửa.")}
                spinnerTone="brand"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">edit_note</span>
                  Yêu cầu chỉnh sửa
                </span>
                <span>Trả về nháp</span>
              </AsyncActionButton>
              <AsyncActionButton
                type="button"
                className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("reject")}`}
                disabled={submitting !== null}
                loading={submitting === "REJECTED"}
                loadingText="Đang từ chối..."
                onClick={() => submitDecision("REJECTED", "Job đã bị từ chối trong luồng phê duyệt.")}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">cancel</span>
                  Từ chối job
                </span>
                <span>Kết thúc duyệt</span>
              </AsyncActionButton>
            </div>

            <div className="mt-6 border-t border-[#f0eceb] pt-6">
              <p className="eyebrow">Tóm tắt phê duyệt</p>
              <p className="mt-3 text-[13px] leading-6 text-[#1a1c1c]">{detail.approvalSnapshot?.summary ?? "Chưa có dữ liệu tóm tắt phê duyệt."}</p>
              {detail.approvalSnapshot?.approvedByName ? (
                <p className="mt-2 text-[12px] font-semibold text-[#5f5e5e]">
                  Người duyệt gần nhất: {detail.approvalSnapshot.approvedByName}
                </p>
              ) : null}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#232525] to-[#161718] p-6 text-white">
            <p className="eyebrow text-white/60">Ngữ cảnh phê duyệt</p>
            <div className="relative z-10 mt-5 grid grid-cols-2 gap-5">
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.insights.applicationsCount}</p>
                <p className="mt-1 text-[12px] text-white/70">Hồ sơ ứng tuyển</p>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.insights.activePipelineCount}</p>
                <p className="mt-1 text-[12px] text-white/70">Pipeline đang chạy</p>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.insights.requiredSkillsCount}</p>
                <p className="mt-1 text-[12px] text-white/70">Kỹ năng yêu cầu</p>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.minExperienceYears ?? 0}y</p>
                <p className="mt-1 text-[12px] text-white/70">Kinh nghiệm tối thiểu</p>
              </div>
            </div>
            <div className="absolute bottom-[-24px] right-[-24px] opacity-[0.06]">
              <span className="material-symbols-outlined text-[140px] text-white">insights</span>
            </div>
          </section>

          <section className="card p-6">
            <p className="eyebrow">HR phụ trách</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[14px] font-bold text-[#b90014]">
                {detail.hrOwner.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-[#1a1c1c]">{detail.hrOwner.fullName}</p>
                <p className="truncate text-[13px] text-[#5f5e5e]">{detail.hrOwner.email}</p>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#5f5e5e]">
              <span className="material-symbols-outlined text-[16px]">call</span>
              {detail.hrOwner.phone || "Chưa có số điện thoại"}
            </p>
            <div className="mt-6 border-t border-[#f0eceb] pt-4">
              <p className="eyebrow">Bối cảnh phòng ban</p>
              <p className="mt-2 text-[13px] leading-6 text-[#1a1c1c]">{detail.department.description || "Hiện chưa có mô tả phòng ban trong bộ dữ liệu seed."}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerJobApprovalDetailScreen;
