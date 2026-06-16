import { useEffect, useState } from "react";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import LoadingIndicator from "../../common/components/LoadingIndicator";
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
        <span className={`rounded px-3 py-1 text-[10px] font-bold uppercase ${item.statusClassName}`}>
          {item.status}
        </span>
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

    setLoading(true);
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
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Đang tải bảng điều khiển HR..." />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="w-full px-4 py-6 md:px-10">
        <div className="border border-[#e2dfde] bg-white p-8 text-center">
          <h2 className="text-[24px] font-semibold text-[#1a1c1c]">Tổng quan tuyển dụng</h2>
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
      helper: "+2 so với tuần trước",
      helperClassName: "text-[#0079b9]",
      icon: "work",
    },
    {
      label: "Tổng ứng viên",
      value: String(dashboard.stats.totalApplicants),
      helper: "Tỷ lệ chuyển đổi 15.2%",
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
    <div className="w-full space-y-6 px-4 py-6 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Tổng quan tuyển dụng
          </h2>
          <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
            Các chỉ số hiệu suất cho đợt tuyển dụng hiện tại
          </p>
        </div>

        <div className="flex gap-2">
          <PermissionGuard permissions={PERMISSIONS.DASHBOARD_EXPORT}>
            <button
              type="button"
              className="flex items-center gap-2 bg-[#e2e2e2] px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#e2dfde]"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Xuất báo cáo
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCardsData.map((card) => (
          <div
            key={card.label}
            className="flex cursor-default items-center justify-between border border-[#e2dfde] bg-white p-6 transition-colors hover:border-[#b90014]"
          >
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                {card.label}
              </p>
              <h3 className="mt-2 text-[40px] font-bold leading-none text-[#1a1c1c]">
                {card.value}
              </h3>
              <p className={`mt-2 text-[14px] leading-5 ${card.helperClassName ?? "text-[#5f5e5e]"}`}>
                {card.helper}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center bg-[#ffdad6]">
              <span className="material-symbols-outlined text-[#b90014]">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden border border-[#e2dfde] bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#e2dfde] bg-white px-6 py-4">
            <h4 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
              Hồ sơ ứng tuyển gần đây
            </h4>
            <button
              type="button"
              className="text-[12px] font-bold tracking-[0.05em] text-[#b90014] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="overflow-x-auto">
            <CommonTable
              columns={buildRecentApplicationsColumns()}
              data={recentApplicationsData}
              keyExtractor={(item) => `${item.candidateName}-${item.date}`}
              loading={false}
              emptyMessage="Chưa có hồ sơ ứng tuyển gần đây."
              zebra
              hover
              tableWrapperClassName="overflow-hidden border border-[#e2dfde] bg-white"
            />
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="flex h-full flex-col border border-[#e2dfde] bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                Chờ phê duyệt
              </h4>
              <span className="rounded-full bg-[#b90014] px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingApprovalsData.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
              {pendingApprovalsData.map((item) => (
                <div
                  key={item.title}
                  className="border border-[#e2dfde] bg-white p-4 transition-all hover:shadow-sm"
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
                className="mt-6 w-full border border-[#e2dfde] py-2 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
              >
                Xem tất cả phê duyệt
              </button>
            </PermissionGuard>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <section className="relative overflow-hidden bg-[#1a1c1c] p-6 md:col-span-1">
          <div className="relative z-10">
            <h4 className="mb-2 text-[20px] font-semibold leading-7 text-white">
              Tốc độ tuyển dụng
            </h4>
            <p className="text-[14px] leading-5 text-[#c8c6c5]">
              Thời gian tuyển trung bình đã giảm 12% trong kỳ này.
            </p>
          </div>
          <div className="absolute bottom-[-20px] right-[-20px] opacity-10">
            <span className="material-symbols-outlined text-[120px] text-white">trending_up</span>
          </div>
        </section>

        <section className="flex flex-col items-start gap-6 border border-[#e2dfde] bg-[#f3f3f3] p-6 md:col-span-3 md:flex-row md:items-center">
          <div className="flex-1">
            <h4 className="mb-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
              Báo cáo đa dạng & hòa nhập
            </h4>
            <p className="max-w-md text-[14px] leading-5 text-[#5f5e5e]">
              Đội ngũ của bạn đã đạt 85% mục tiêu hòa nhập trong năm. Xem chi
              tiết để tối ưu chiến lược tiếp cận ứng viên.
            </p>
            <PermissionGuard permissions={PERMISSIONS.DASHBOARD_VIEW_INTERNAL}>
              <button
                type="button"
                className="mt-4 bg-[#1a1c1c] px-6 py-2 text-[12px] font-bold tracking-[0.05em] text-white transition-colors hover:bg-[#c8c6c5] hover:text-[#1a1c1c]"
              >
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
