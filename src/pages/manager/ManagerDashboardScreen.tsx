import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import EmptyState from "../../common/components/EmptyState";
import PageHeader from "../../common/components/PageHeader";
import { managerService, type ManagerDashboardDto } from "../../services/manager/managerService";

function statusChipTone(status: string) {
  switch (status.toLowerCase()) {
    case "managerreview":
      return "bg-[#fff1f0] text-[#b90014]";
    case "reviewing":
      return "bg-amber-50 text-amber-700";
    case "interviewing":
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-[#f2efed] text-[#5f5e5e]";
  }
}

function ManagerDashboardScreen() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ManagerDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const response = await managerService.getDashboard();
        if (!mounted) return;
        setDashboard(response.data);
      } catch {
        if (!mounted) return;
        setDashboard(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [
        { label: "Chờ phê duyệt", value: "0", helper: "Chưa có mục cần duyệt" },
        { label: "Hồ sơ đang xử lý", value: "0", helper: "Trên 0 phòng ban" },
        { label: "Chu kỳ duyệt TB", value: "0d", helper: "Chưa đủ dữ liệu phỏng vấn hoàn tất" },
        { label: "Tỷ lệ chấp nhận", value: "0%", helper: "Chưa có hồ sơ ở giai đoạn offer" },
      ];
    }

    return [
      {
        label: "Chờ phê duyệt",
        value: String(dashboard.summary.pendingApprovals),
        helper:
          dashboard.summary.pendingApprovals > 0
            ? "Cần quản lý xử lý"
            : "Không có job chờ duyệt",
      },
      {
        label: "Hồ sơ đang xử lý",
        value: String(dashboard.summary.activeApplications),
        helper: `Trên ${dashboard.summary.departmentCount} phòng ban`,
      },
      {
        label: "Chu kỳ duyệt TB",
        value: `${dashboard.summary.averageReviewCycleDays}d`,
        helper: dashboard.summary.averageReviewCycleLabel,
      },
      {
        label: "Tỷ lệ chấp nhận",
        value: `${dashboard.summary.acceptanceRate}%`,
        helper: dashboard.summary.acceptanceRateLabel,
      },
    ];
  }, [dashboard]);

  const maxDepartmentDays = Math.max(
    ...(dashboard?.departmentHiringSpeed.map((item) => item.averageDays) ?? [1]),
    1,
  );

  const funnelConversionRate = useMemo(() => {
    if (!dashboard?.recruitmentFunnel.length) return 0;

    const sourced = dashboard.recruitmentFunnel[0]?.count ?? 0;
    const offered = dashboard.recruitmentFunnel[dashboard.recruitmentFunnel.length - 1]?.count ?? 0;
    if (sourced === 0) return 0;

    return ((offered / sourced) * 100).toFixed(2);
  }, [dashboard]);

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="surface-card h-96 lg:col-span-2" />
          <div className="surface-card h-96" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10">
          <EmptyState
            icon="error"
            title="Bảng điều khiển quản lý"
            description="Hiện chưa thể tải dữ liệu bảng điều khiển. Vui lòng thử lại."
          />
        </div>
      </div>
    );
  }

  const summaryIcons = ["pending_actions", "description", "schedule", "verified"];
  const summaryWraps = [
    "from-[#fff1f0] to-[#ffdad6] text-[#b90014]",
    "from-sky-50 to-sky-100 text-sky-600",
    "from-[#f2efed] to-[#e8e4e1] text-[#5f5e5e]",
    "from-emerald-50 to-emerald-100 text-emerald-600",
  ];

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <PageHeader
        eyebrow="Bảng điều khiển"
        icon="insights"
        title="Bảng điều khiển quản lý"
        subtitle="Theo dõi tập trung vào quyết định duyệt job, review ứng viên và sức khỏe pipeline tuyển dụng."
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/manager/applications")}
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              Mở hàng chờ review
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/jobs")}
            >
              <span className="material-symbols-outlined text-[18px]">approval</span>
              Duyệt job
            </button>
          </>
        }
      />

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">{card.label}</p>
                <h3 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </h3>
                <p className={`mt-2.5 text-[13px] leading-5 ${index === 0 || index === 3 ? "text-[#b90014]" : "text-[#5f5e5e]"}`}>
                  {card.helper}
                </p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${summaryWraps[index]} transition-transform duration-200 group-hover:scale-105`}>
                <span className="material-symbols-outlined">{summaryIcons[index]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#f0eceb] px-5 py-4">
              <h4 className="section-title">Job chờ phê duyệt</h4>
              <span className="badge bg-[#fff1f0] text-[#b90014]">Cần xử lý</span>
            </div>

            {dashboard.pendingApprovals.length ? (
              <div className="divide-y divide-[#f0eceb]">
                {dashboard.pendingApprovals.map((item) => (
                  <div
                    key={item.jobId}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#faf9f8] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="badge bg-[#f2efed] text-[#5f5e5e]">
                          {item.meta.split(" • ")[0] || "Chung"}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-[15px] font-semibold text-[#1a1c1c]">{item.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#5f5e5e]">
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        {item.meta.split(" • ").slice(1).join(" • ") || item.meta}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary h-10 shrink-0"
                      onClick={() => navigate("/jobs")}
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Xem và duyệt
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="task_alt"
                title="Không có job chờ duyệt"
                description="Không có job nào đang chờ phê duyệt."
              />
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-[#f0eceb] px-5 py-4">
              <h4 className="section-title">Cần quyết định cuối</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              {dashboard.finalDecisions.length ? (
                dashboard.finalDecisions.map((item) => (
                  <article key={item.applicationId} className="card-interactive flex gap-4 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                      {item.avatarUrl ? (
                        <img alt={item.candidateName} className="h-full w-full object-cover" src={item.avatarUrl} />
                      ) : (
                        <span className="text-base font-bold">
                          {item.candidateName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold text-[#1a1c1c]">{item.candidateName}</h3>
                          <p className="truncate text-[13px] text-[#5f5e5e]">{item.jobTitle}</p>
                        </div>
                        <span className={`badge shrink-0 ${statusChipTone(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 rounded-[10px] border-l-2 border-[#b90014] bg-[#faf9f8] px-3 py-2 text-[12px] italic leading-5 text-[#5f5e5e]">
                        {item.recommendationNote}
                      </div>
                      <button
                        type="button"
                        className="btn btn-dark mt-3 h-10 w-full"
                        onClick={() => navigate(`/manager/applications/${item.applicationId}`)}
                      >
                        Mở review
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="md:col-span-2">
                  <EmptyState
                    icon="how_to_reg"
                    title="Chưa có quyết định cần xử lý"
                    description="Hiện chưa có ứng viên nào cần quản lý quyết định cuối."
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h4 className="eyebrow mb-5">Chu kỳ duyệt theo phòng ban (ngày)</h4>
            <div className="space-y-4">
              {dashboard?.departmentHiringSpeed.length ? (
                dashboard.departmentHiringSpeed.map((item, index) => (
                  <div key={item.departmentName}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="text-[#1a1c1c]">{item.departmentName}</span>
                      <span className="font-bold text-[#1a1c1c]">{item.averageDays}d</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0eceb]">
                      <div
                        className={index % 3 === 1 ? "h-full rounded-full bg-[#1a1c1c]" : index % 3 === 2 ? "h-full rounded-full bg-[#8a8786]" : "h-full rounded-full bg-gradient-to-r from-[#e8242c] to-[#b90014]"}
                        style={{ width: `${Math.max((item.averageDays / maxDepartmentDays) * 100, 10)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[#5f5e5e]">Chưa có chu kỳ phỏng vấn hoàn tất để thống kê.</p>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h4 className="eyebrow mb-5">Phễu tuyển dụng</h4>
            <div className="flex flex-col gap-2">
              {(dashboard?.recruitmentFunnel ?? []).map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-[10px] px-4 py-3 text-white ${
                    index === 0 ? "bg-[#1a1c1c]" : index === 1 ? "mx-2 bg-[#2a2c2c]" : index === 2 ? "mx-4 bg-[#3a3c3c]" : "mx-8 bg-gradient-to-r from-[#e8242c] to-[#b90014]"
                  }`}
                >
                  <span className="text-[12px] font-semibold">{item.label}</span>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[12px] text-[#5f5e5e]">
              Tỷ lệ chuyển đổi tới offer: <span className="font-bold text-[#1a1c1c]">{funnelConversionRate}%</span>
            </p>
          </section>

          <section className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#232525] to-[#161718] p-6 text-white">
            <p className="eyebrow mb-4 text-white/60">Thao tác nhanh</p>
            <ul className="relative z-10 space-y-3.5">
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 text-left text-[14px] transition-colors hover:text-[#ffdad6]"
                  onClick={() => navigate("/manager/applications")}
                >
                  <span className="material-symbols-outlined text-[20px] text-[#b90014]">how_to_reg</span>
                  Xem quyết định cuối của ứng viên
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 text-left text-[14px] transition-colors hover:text-[#ffdad6]"
                  onClick={() => navigate("/jobs")}
                >
                  <span className="material-symbols-outlined text-[20px] text-[#b90014]">approval</span>
                  Duyệt các yêu cầu tuyển dụng đang chờ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 text-left text-[14px] text-white/70 transition-colors hover:text-[#ffdad6]"
                  onClick={() => navigate("/manager/reports")}
                >
                  <span className="material-symbols-outlined text-[20px] text-[#8a8786]">monitoring</span>
                  Mở báo cáo tuyển dụng
                </button>
              </li>
            </ul>
            <div className="absolute bottom-[-24px] right-[-24px] opacity-[0.06]">
              <span className="material-symbols-outlined text-[140px] text-white">bolt</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboardScreen;
