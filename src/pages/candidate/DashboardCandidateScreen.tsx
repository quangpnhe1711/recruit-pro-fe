import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { candidateService, type CandidateDashboardDto } from "../../services/candidate/candidateService";

type StatCard = {
  icon: string;
  iconClassName: string;
  label: string;
  value: string;
  helper: string;
};

function DashboardCandidateScreen() {
  const [dashboard, setDashboard] = useState<CandidateDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    candidateService
      .getDashboard()
      .then((res) => {
        if (mounted && res.data) setDashboard(res.data);
      })
      .catch(() => {
        if (mounted) setDashboard(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Đang tải bảng điều khiển ứng viên..." />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <section className="w-full px-4 py-10 md:px-10">
        <div className="border border-[#e2dfde] bg-white p-8 text-center">
          <h2 className="text-[24px] font-semibold leading-8 text-[#1a1c1c]">
            Bảng điều khiển ứng viên
          </h2>
          <p className="mt-3 text-[14px] text-[#5f5e5e]">
            Hiện chưa thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.
          </p>
        </div>
      </section>
    );
  }

  const statCards = [
    {
      icon: "assignment",
      iconClassName: "text-[#b90014]",
      label: "Việc đã ứng tuyển",
      value: String(dashboard.stats.appliedJobs).padStart(2, "0"),
      helper: dashboard.stats.appliedJobs > 0 ? "+1 so với tuần trước" : "Chưa có đơn ứng tuyển",
    },
    {
      icon: "event",
      iconClassName: "text-[#005f93]",
      label: "Phỏng vấn",
      value: String(dashboard.stats.interviews).padStart(2, "0"),
      helper: dashboard.upcomingInterview
        ? `Lịch gần nhất lúc ${dashboard.upcomingInterview.time}`
        : "Chưa có lịch phỏng vấn",
    },
    {
      icon: "notifications_active",
      iconClassName: "text-[#1a1c1c]",
      label: "Unread",
      value: String(dashboard.stats.unreadNotifications).padStart(2, "0"),
      helper:
        dashboard.stats.unreadNotifications > 0
          ? "Có cập nhật mới"
          : "Không có thông báo chưa đọc",
    },
  ];

  const recommendedJobs = dashboard.recommendedJobs ?? [];
  const upcomingInterview = dashboard.upcomingInterview;
  const stats = dashboard.stats;

  return (
    <section className="w-full px-4 py-10 md:px-10">
            <div className="mb-10">
              <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                Chào mừng quay lại, {dashboard?.greetingName ?? user?.fullName ?? "Ứng viên"}
              </h2>
              <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
                {stats
                  ? `Bạn có ${stats.interviews} lịch phỏng vấn và ${stats.unreadNotifications} thông báo mới.`
                  : "Chưa có hoạt động nào trên bảng điều khiển."}
              </p>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="cursor-pointer border border-[#e2dfde] bg-white p-6 transition-colors hover:border-[#b90014]"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`material-symbols-outlined text-3xl ${card.iconClassName}`}
                    >
                      {card.icon}
                    </span>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                      {card.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[56px] font-extrabold leading-none text-[#1a1c1c]">
                      {card.value}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-[14px] text-[#5f5e5e]">
                      <span>{card.helper}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#b90014]">
                    calendar_today
                  </span>
                  <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                    Phỏng vấn sắp tới
                  </h3>
                </div>

                <div className="flex h-full flex-col border-l-4 border-[#b90014] bg-[#1A1A1A] p-6 text-white">
                  <div className="mb-6">
                    <span className="rounded-full bg-[#b90014] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      Hôm nay
                    </span>
                    <h4 className="mt-4 text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                      {upcomingInterview?.time ?? "Chưa có lịch sắp tới"}
                    </h4>
                    <p className="text-[16px] leading-6 text-[#c8c6c5]">
                      {upcomingInterview?.date ?? "Chưa có lịch phỏng vấn"}
                    </p>
                  </div>

                  <div className="mb-8 space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                        Vị trí
                      </span>
                      <span className="text-[16px] font-bold">
                        {upcomingInterview?.jobTitle ?? "Chưa có lịch phỏng vấn"}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                        Người phỏng vấn
                      </span>
                      <span className="text-[16px]">
                        {upcomingInterview
                          ? `${upcomingInterview.interviewerName}, ${upcomingInterview.interviewerTitle}`
                          : "Chưa phân công người phỏng vấn"}
                      </span>
                    </div>
                  </div>

                  <a
                    className="mt-auto flex w-full items-center justify-center gap-2 bg-[#b90014] py-4 text-[12px] font-bold uppercase tracking-[0.18em] transition-colors hover:brightness-110"
                    href={upcomingInterview?.meetingUrl ?? "#"}
                  >
                    <span className="material-symbols-outlined">
                      video_call
                    </span>
                    Tham gia cuộc họp
                  </a>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#b90014]">
                      recommend
                    </span>
                    <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                      Việc làm gợi ý
                    </h3>
                  </div>
                  <a
                    className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
                    href="#"
                  >
                    Xem tất cả tin tuyển dụng
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {recommendedJobs.length === 0 ? (
                    <div className="border border-[#e2dfde] bg-white p-6 text-[14px] text-[#5f5e5e] md:col-span-2">
                      Không có dữ liệu
                    </div>
                  ) : (
                    recommendedJobs.map((job) => {
                      const isCompact = job.layout === "compact";

                      if (isCompact) {
                        return (
                          <div
                            key={job.id}
                            className="border border-[#e2dfde] bg-white p-6 md:col-span-2"
                          >
                          <div className="flex items-center gap-6">
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center border border-[#e2dfde] bg-[#eeeeee]">
                              <span className="material-symbols-outlined text-4xl text-[#b90014]">
                                work
                              </span>
                            </div>

                            <div className="flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <h4 className="text-[16px] font-bold text-[#1a1c1c]">
                                  {job.title}
                                </h4>
                                <span className="bg-[#e2dfde]/30 px-2 py-1 text-[10px] font-bold uppercase text-[#5f5e5e]">
                                  {job.employmentType}
                                </span>
                              </div>
                              <p className="mb-2 text-[14px] text-[#5f5e5e]">
                                {job.meta}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {job.skills.map((chip) => (
                                  <span
                                    key={chip}
                                    className="rounded-full bg-[#eeeeee] px-2 py-1 text-[10px] font-semibold text-[#5f5e5e]"
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              className="bg-[#e31b23] px-10 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:brightness-110"
                              type="button"
                            >
                              {job.actionLabel ?? "Ứng tuyển ngay"}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={job.id}
                        className="border border-[#e2dfde] bg-white p-6 transition-shadow hover:shadow-sm"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center border border-[#e2dfde] bg-[#eeeeee]">
                            <span className="material-symbols-outlined text-[#b90014]">
                              work
                            </span>
                          </div>
                          <span className="bg-[#e2dfde]/30 px-2 py-1 text-[10px] font-bold uppercase text-[#5f5e5e]">
                            {job.employmentType}
                          </span>
                        </div>

                        <h4 className="mb-1 text-[16px] font-bold text-[#1a1c1c] transition-colors hover:text-[#b90014]">
                          {job.title}
                        </h4>
                        <p className="mb-4 text-[14px] text-[#5f5e5e]">
                          {job.meta}
                        </p>

                        <div className="mb-6 flex flex-wrap gap-2">
                          {job.skills.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full bg-[#eeeeee] px-3 py-1 text-[10px] font-semibold text-[#5f5e5e]"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>

                        <button
                          className="w-full border border-[#1a1c1c] py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-[#1a1c1c] transition-colors hover:bg-[#1a1c1c] hover:text-white"
                          type="button"
                        >
                          {job.actionLabel ?? "Ứng tuyển nhanh"}
                        </button>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            </div>
    </section>
  );
}

export default DashboardCandidateScreen;
