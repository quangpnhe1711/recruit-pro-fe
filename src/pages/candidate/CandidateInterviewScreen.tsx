import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { getInterviewTimingStatus } from "../../common/utils/interviewPresentation";
import {
  candidateService,
  type CandidateInterviewItemDto,
} from "../../services/candidate/candidateService";

function normalizeStatus(status: string) {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "Đã lên lịch";
    case "completed":
      return "Đã hoàn thành";
    case "canceled":
      return "Đã hủy";
    default:
      return status;
  }
}

function statusChip(status: string) {
  switch (status) {
    case "Đã lên lịch":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Đã hoàn thành":
      return "bg-[#b90014]/10 text-[#b90014]";
    case "Đã hủy":
      return "bg-[#e2dfde] text-[#5f5e5e]";
    default:
      return "bg-[#f3f3f3] text-[#5f5e5e]";
  }
}

function CandidateInterviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CandidateInterviewItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(
    null,
  );

  const spotlightJobTitle = useMemo(
    () => new URLSearchParams(location.search).get("jobTitle")?.trim() ?? "",
    [location.search],
  );

  useEffect(() => {
    let mounted = true;

    candidateService
      .getInterviews()
      .then((response) => {
        if (!mounted) {
          return;
        }

        const nextItems = response.data ?? [];
        setItems(nextItems);

        const spotlightInterview = spotlightJobTitle
          ? nextItems.find(
              (item) =>
                item.jobTitle.trim().toLowerCase() ===
                spotlightJobTitle.toLowerCase(),
            ) ?? null
          : null;

        setSelectedInterviewId(
          spotlightInterview?.id ?? nextItems[0]?.id ?? null,
        );
      })
      .catch(() => {
        if (mounted) {
          toast.error("Không thể tải danh sách phỏng vấn.");
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
  }, [spotlightJobTitle]);

  const stats = useMemo(() => {
    const scheduled = items.filter(
      (item) => item.status.toLowerCase() === "scheduled",
    ).length;
    const completed = items.filter(
      (item) => item.status.toLowerCase() === "completed",
    ).length;
    const nextInterview = items
      .filter((item) => new Date(item.startAt).getTime() >= Date.now())
      .sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      )[0];

    return {
      scheduled,
      completed,
      nextInterview,
    };
  }, [items]);

  const selectedInterview = useMemo(
    () => items.find((item) => item.id === selectedInterviewId) ?? null,
    [items, selectedInterviewId],
  );
  const selectedInterviewTimingStatus = useMemo(
    () =>
      selectedInterview
        ? getInterviewTimingStatus(
            selectedInterview.startAt,
            selectedInterview.endAt,
            selectedInterview.status,
          )
        : null,
    [selectedInterview],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Đang tải lịch phỏng vấn..." />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-10">
      <div className="mb-8">
        <h1 className="page-title">
          Lịch phỏng vấn của tôi
        </h1>
        <p className="mt-2 text-[14px] text-[#5f5e5e]">
          Theo dõi các vòng phỏng vấn, xem chi tiết từng lịch và chuẩn bị cho
          bước tiếp theo.
        </p>
        {spotlightJobTitle ? (
          <div className="mt-4 inline-flex items-center gap-2 border border-[#e7bdb8] bg-[#fff8f7] px-4 py-2 text-[13px] text-[#1a1c1c]">
            <span className="material-symbols-outlined text-[18px] text-[#b90014]">
              target
            </span>
            Đang hiển thị lịch phỏng vấn liên quan đến vị trí{" "}
            <strong>{spotlightJobTitle}</strong>.
          </div>
        ) : null}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
            Đã lên lịch
          </p>
          <p className="mt-3 text-[32px] font-semibold text-[#005f93]">
            {stats.scheduled}
          </p>
        </div>
        <div className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
            Đã hoàn thành
          </p>
          <p className="mt-3 text-[32px] font-semibold text-[#b90014]">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
            Lịch gần nhất
          </p>
          <p className="mt-3 text-[18px] font-semibold text-[#1a1c1c]">
            {stats.nextInterview
              ? stats.nextInterview.dateLabel
              : "Chưa có lịch sắp tới"}
          </p>
          <p className="mt-1 text-[14px] text-[#5f5e5e]">
            {stats.nextInterview
              ? `${stats.nextInterview.jobTitle} • ${stats.nextInterview.timeLabel}`
              : "Hiện bạn chưa có buổi phỏng vấn nào sắp diễn ra."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="overflow-hidden rounded-lg border border-[#e2dfde] bg-white">
          <div className="border-b border-[#e2dfde] px-6 py-4">
            <h2 className="text-[20px] font-semibold text-[#1a1c1c]">
              Dòng thời gian phỏng vấn
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-10 text-[14px] text-[#5f5e5e]">
              Chưa có lịch phỏng vấn nào được tạo.
            </div>
          ) : (
            <div className="divide-y divide-[#e2dfde]">
              {items.map((item) => {
                const normalizedStatus = normalizeStatus(item.status);
                const timingStatus = getInterviewTimingStatus(
                  item.startAt,
                  item.endAt,
                  item.status,
                );
                const isSelected = item.id === selectedInterviewId;
                const isSpotlighted =
                  spotlightJobTitle &&
                  item.jobTitle.trim().toLowerCase() ===
                    spotlightJobTitle.toLowerCase();

                return (
                  <div
                    key={item.id}
                    className={`grid gap-4 px-6 py-5 transition-colors md:grid-cols-[1.2fr_1fr_1fr] md:items-center ${
                      isSelected
                        ? "bg-[#fff8f7]"
                        : isSpotlighted
                          ? "bg-[#f9fcff]"
                          : "bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-[16px] font-semibold text-[#1a1c1c]">
                        {item.jobTitle}
                      </p>
                      <p className="mt-1 text-[14px] text-[#5f5e5e]">
                        {item.dateLabel} • {item.timeLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                        Người phỏng vấn
                      </p>
                      <p className="mt-1 text-[14px] text-[#1a1c1c]">
                        {item.interviewer}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusChip(normalizedStatus)}`}
                        >
                          {normalizedStatus}
                        </span>
                        {timingStatus ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${timingStatus.className}`}
                          >
                            {timingStatus.label}
                          </span>
                        ) : null}
                      </div>
                      <button
                        className="border-b-2 border-transparent text-[12px] font-bold text-[#1a1c1c] transition-colors hover:border-[#b90014]"
                        type="button"
                        onClick={() => setSelectedInterviewId(item.id)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                Chi tiết lịch
              </p>
              <h3 className="mt-2 text-[22px] font-semibold text-[#1a1c1c]">
                {selectedInterview?.jobTitle ?? "Chọn một lịch phỏng vấn"}
              </h3>
            </div>
            {spotlightJobTitle ? (
              <button
                className="text-[12px] font-semibold text-[#005f93] hover:underline"
                type="button"
                onClick={() => navigate("/candidate/my-applications")}
              >
                Về đơn ứng tuyển
              </button>
            ) : null}
          </div>

          {selectedInterview ? (
            <div className="space-y-4">
              <div className="border border-[#efe9e8] bg-[#faf8f8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                  Thời gian
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#1a1c1c]">
                  {selectedInterview.dateLabel}
                </p>
                <p className="mt-1 text-[14px] text-[#5f5e5e]">
                  {selectedInterview.timeLabel}
                </p>
              </div>

              <div className="border border-[#efe9e8] bg-[#faf8f8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                  Người phỏng vấn
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#1a1c1c]">
                  {selectedInterview.interviewer}
                </p>
              </div>

              <div className="border border-[#efe9e8] bg-[#faf8f8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                  Trạng thái
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusChip(normalizeStatus(selectedInterview.status))}`}
                  >
                    {normalizeStatus(selectedInterview.status)}
                  </span>
                  {selectedInterviewTimingStatus ? (
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${selectedInterviewTimingStatus.className}`}
                    >
                      {selectedInterviewTimingStatus.label}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="border border-[#efe9e8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                  Gợi ý chuẩn bị
                </p>
                <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#1a1c1c]">
                  <li>Kiểm tra lại CV và mô tả công việc trước buổi phỏng vấn.</li>
                  <li>Chuẩn bị các ví dụ dự án liên quan đến vị trí ứng tuyển.</li>
                  <li>Đăng nhập sớm 5-10 phút nếu là buổi phỏng vấn trực tuyến.</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-[#5f5e5e]">
              Chọn một lịch phỏng vấn ở danh sách bên trái để xem chi tiết.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default CandidateInterviewScreen;
