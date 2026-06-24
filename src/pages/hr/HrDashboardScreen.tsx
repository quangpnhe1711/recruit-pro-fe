import { useEffect, useState } from "react";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import PermissionGuard from "../../guards/PermissionGuard";
import {
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
} from "../../common/utils/applicationPresentation";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService, type HrDashboardDto } from "../../services/hr/hrService";

type StatCard = {
  label: string;
  value: string;
  helper: string;
  helperClassName?: string;
  icon: string;
};

type RecentApplication = {
  candidateName: string;
  jobAppliedFor: string;
  status: string;
  statusClassName: string;
  date: string;
};

type PendingApproval = {
  title: string;
  meta: string;
  extraCount?: string;
};

function buildRecentApplicationsColumns(): TableColumn<RecentApplication>[] {
  return [
    {
      key: "candidateName",
      header: "Tên ứng viên",
      renderCell: (item) => <span className="font-semibold">{item.candidateName}</span>,
    },
    {
      key: "jobAppliedFor",
      header: "Vị trí ứng tuyển",
      renderCell: (item) => <span className="text-[#5f5e5e]">{item.jobAppliedFor}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      renderCell: (item) => (
        <span className={`badge ${item.statusClassName}`}>{item.status}</span>
      ),
    },
    {
      key: "date",
      header: "Ngày",
      renderCell: (item) => <span className="text-[#5f5e5e]">{item.date}</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      headerClassName: "text-right",
      alignRight: true,
      renderCell: () => (
        <button
          type="button"
          className="text-[#1a1c1c] transition-colors hover:text-[#b90014]"
          aria-label="Thêm thao tác"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      ),
    },
  ];
}

function HrDashboardScreen() {
  const [dashboard, setDashboard] = useState<HrDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    hrService
      .getDashboard()
      .then((res) => {
        if (mounted && res.data) {
          setDashboard(res.data);
        }
      })
      .catch(() => {
        if (mounted) {
          setDashboard(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="surface-card h-80 lg:col-span-2" />
          <div className="surface-card h-80" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10 text-center">
          <h2 className="text-[22px] font-semibold text-[#1a1c1c]">Tổng quan tuyển dụng</h2>
          <p className="mt-3 text-[14px] text-[#5f5e5e]">
            Hiện chưa thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.
          </p>
        </div>
      </div>
    );
  }

  const statCardsData: StatCard[] = [
    {
      label: "Tin đang tuyển",
      value: String(dashboard.stats.activePostings),
      helper: "Đang mở trên hệ thống",
      helperClassName: "text-[#0079b9]",
      icon: "work",
    },
    {
      label: "Tổng ứng viên",
      value: String(dashboard.stats.totalApplicants),
      helper: "Tổng hồ sơ đã ghi nhận",
      helperClassName: "text-[#0079b9]",
      icon: "group",
    },
    {
      label: "Phỏng vấn hôm nay",
      value: String(dashboard.stats.interviewsToday),
      helper: dashboard.stats.nextInterviewLabel,
      helperClassName: "text-[#ba1a1a]",
      icon: "schedule",
    },
  ];

  const recentApplicationsData: RecentApplication[] =
    dashboard.recentApplications?.map((item) => ({
      candidateName: item.candidateName,
      jobAppliedFor: item.jobAppliedFor,
      status: formatApplicationStatus(item.status),
      statusClassName: getApplicationStatusBadgeClass(item.status),
      date: new Date(item.date).toLocaleDateString(),
    })) ?? [];

  const pendingApprovalsData: PendingApproval[] =
    dashboard.pendingApprovals?.map((item) => ({
      title: item.title,
      meta: item.meta,
      extraCount: item.approverCount > 1 ? `+${item.approverCount - 1}` : undefined,
    })) ?? [];

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <PageHeader
        eyebrow="Bảng điều khiển"
        icon="space_dashboard"
        title="Tổng quan tuyển dụng"
        subtitle="Các chỉ số hiệu suất cho đợt tuyển dụng hiện tại"
        actions={
          <PermissionGuard permissions={PERMISSIONS.DASHBOARD_EXPORT}>
            <button type="button" className="btn btn-secondary">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Xuất báo cáo
            </button>
          </PermissionGuard>
        }
      />

      <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-3">
        {statCardsData.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">{card.label}</p>
                <h3 className="mt-3 text-[38px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </h3>
                <p className={`mt-2.5 text-[13px] leading-5 ${card.helperClassName ?? "text-[#5f5e5e]"}`}>
                  {card.helper}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014] transition-transform duration-200 group-hover:scale-105">
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#f0eceb] px-5 py-4">
            <h4 className="section-title">Hồ sơ ứng tuyển gần đây</h4>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] transition-colors hover:gap-1.5"
            >
              Xem tất cả
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <CommonTable
            columns={buildRecentApplicationsColumns()}
            data={recentApplicationsData}
            keyExtractor={(item) => `${item.candidateName}-${item.date}`}
            loading={false}
            emptyMessage="Chưa có hồ sơ ứng tuyển gần đây."
            hover
            tableWrapperClassName="overflow-hidden bg-white"
          />
        </section>

        <aside className="flex flex-col gap-6">
          <section className="card flex h-full flex-col p-5">
            <div className="mb-5 flex items-center justify-between">
              <h4 className="section-title">Chờ phê duyệt</h4>
              <span className="badge bg-[#fff1f0] text-[#b90014]">
                {pendingApprovalsData.length} mục
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1 scrollbar-hide">
              {pendingApprovalsData.map((item) => (
                <div
                  key={item.title}
                  className="card-interactive p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-bold tracking-[0.05em] text-[#1a1c1c]">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-[#5f5e5e]">{item.meta}</p>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-[#c8c6c5]">
                      history
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {item.extraCount ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#e2dfde] text-[8px] font-bold text-[#1a1c1c]">
                          {item.extraCount}
                        </div>
                      ) : null}
                    </div>

                    <PermissionGuard permissions={PERMISSIONS.JOB_APPROVE}>
                      <button
                        type="button"
                        className="text-[12px] font-bold tracking-[0.05em] text-[#b90014] hover:underline"
                      >
                        Xem bản nháp
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              ))}
            </div>

            <PermissionGuard permissions={PERMISSIONS.JOB_APPROVE}>
              <button
                type="button"
                className="btn btn-secondary mt-5 w-full"
              >
                Xem tất cả phê duyệt
              </button>
            </PermissionGuard>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <section className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#232525] to-[#161718] p-6 md:col-span-1">
          <div className="relative z-10">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/10 text-white">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <h4 className="mb-1.5 text-[17px] font-semibold text-white">
              Tốc độ tuyển dụng
            </h4>
            <p className="text-[13px] leading-5 text-[#b9b6b5]">
              Trung bình{" "}
              <span className="font-semibold text-white">
                {dashboard.hiringVelocity.averageTimeToHireDays} ngày
              </span>{" "}
              để tuyển thành công.
            </p>
          </div>
          <div className="absolute bottom-[-24px] right-[-24px] opacity-[0.07]">
            <span className="material-symbols-outlined text-[140px] text-white">trending_up</span>
          </div>
        </section>

        <section className="card flex flex-col items-start gap-6 p-6 md:col-span-3 md:flex-row md:items-center">
          <div className="flex-1">
            <h4 className="section-title mb-1.5">Báo cáo đa dạng & hòa nhập</h4>
            <p className="max-w-md text-[13px] leading-6 text-[#5f5e5e]">
              Mức hoàn thành mục tiêu hiện tại:{" "}
              <span className="font-semibold text-[#1a1c1c]">
                {dashboard.diversityReport.targetCompletionPercent}%
              </span>
              .
            </p>
            <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#f0eceb]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e8242c] to-[#b90014] transition-all duration-500"
                style={{ width: `${Math.min(100, dashboard.diversityReport.targetCompletionPercent)}%` }}
              />
            </div>
            <PermissionGuard permissions={PERMISSIONS.DASHBOARD_VIEW_INTERNAL}>
              <button type="button" className="btn btn-dark mt-4">
                Xem báo cáo đầy đủ
              </button>
            </PermissionGuard>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HrDashboardScreen;
