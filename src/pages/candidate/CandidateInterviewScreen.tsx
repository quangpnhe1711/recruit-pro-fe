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
  switch (status.trim().toLowerCase()) {
    case "scheduled":
      return "Đã lên lịch";
    case "completed":
      return "Hoàn tất";
    case "canceled":
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "Chưa cập nhật";
  }
}

function statusChip(status: string) {
  switch (status) {
    case "Đã lên lịch":
      return "border-sky-100 bg-sky-50 text-sky-700";
    case "Hoàn tất":
      return "border-green-100 bg-green-50 text-green-700";
    case "Đã hủy":
      return "border-stone-200 bg-stone-100 text-stone-700";
    default:
      return "border-[#e2dfde] bg-[#f3f3f3] text-[#5f5e5e]";
  }
}

function DetailTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: string;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border border-[#e2dfde] bg-[#fafafa] p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b90014]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
            {label}
          </p>
          <p className="mt-1 break-words text-[15px] font-semibold text-[#1a1c1c]">
            {value || "Chưa cập nhật"}
          </p>
          {helper ? (
            <p className="mt-1 text-[13px] leading-5 text-[#5f5e5e]">
              {helper}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CandidateInterviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CandidateInterviewItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(
    null,
  );
  const [currentTime] = useState(() => Date.now());

  const spotlightJobTitle = useMemo(
    () => new URLSearchParams(location.search).get("jobTitle")?.trim() ?? "",
    [location.search],
  );

  useEffect(() => {
    let mounted = true;

    candidateService
      .getInterviews()
      .then((response) => {
        if (!mounted) return;

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
          toast.error("Không thể tải lịch phỏng vấn.");
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
      .filter((item) => new Date(item.startAt).getTime() >= currentTime)
      .sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      )[0];

    return { scheduled, completed, nextInterview };
  }, [currentTime, items]);

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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Lịch phỏng vấn</h1>
          <p className="page-subtitle">
            Xem nhanh thời gian, người phỏng vấn và trạng thái từng buổi.
          </p>
        </div>
        {spotlightJobTitle ? (
          <button
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e7bdb8] bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#fff8f7]"
            type="button"
            onClick={() => navigate("/candidate/my-applications")}
          >
            <span className="material-symbols-outlined text-[18px] text-[#b90014]">
              arrow_back
            </span>
            Về đơn ứng tuyển
          </button>
        ) : null}
      </div>

      {spotlightJobTitle ? (
        <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-lg border border-[#e7bdb8] bg-[#fff8f7] px-4 py-2 text-[13px] text-[#1a1c1c]">
          <span className="material-symbols-outlined text-[18px] text-[#b90014]">
            target
          </span>
          <span className="min-w-0 truncate">
            Đang lọc theo vị trí <strong>{spotlightJobTitle}</strong>
          </span>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#e2dfde] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
            Sắp / đang lên lịch
          </p>
          <p className="mt-2 text-[30px] font-semibold text-[#005f93]">
            {stats.scheduled}
          </p>
        </div>
        <div className="rounded-lg border border-[#e2dfde] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
            Đã hoàn tất
          </p>
          <p className="mt-2 text-[30px] font-semibold text-green-700">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-lg border border-[#e2dfde] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
            Buổi gần nhất
          </p>
          <p className="mt-2 truncate text-[17px] font-semibold text-[#1a1c1c]">
            {stats.nextInterview?.dateLabel ?? "Chưa có lịch"}
          </p>
          <p className="mt-1 truncate text-[14px] text-[#5f5e5e]">
            {stats.nextInterview
              ? `${stats.nextInterview.jobTitle} - ${stats.nextInterview.timeLabel}`
              : "Chưa có buổi phỏng vấn sắp tới."}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[#d6d1cf] bg-white px-6 py-12 text-center">
          <span className="material-symbols-outlined text-[40px] text-[#b90014]">
            event_busy
          </span>
          <h2 className="mt-3 text-[20px] font-semibold text-[#1a1c1c]">
            Chưa có lịch phỏng vấn
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-[#5f5e5e]">
            Khi HR tạo lịch, thông tin thời gian và người phỏng vấn sẽ hiển thị
            tại đây.
          </p>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="overflow-hidden rounded-lg border border-[#e2dfde] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2dfde] px-5 py-4">
              <h2 className="text-[18px] font-semibold text-[#1a1c1c]">
                Danh sách phỏng vấn
              </h2>
              <span className="text-[13px] font-semibold text-[#5f5e5e]">
                {items.length} lịch
              </span>
            </div>

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
                  <button
                    key={item.id}
                    className={`grid w-full gap-4 px-5 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center ${
                      isSelected
                        ? "bg-[#fff8f7]"
                        : isSpotlighted
                          ? "bg-[#f4f9fd]"
                          : "bg-white hover:bg-[#fafafa]"
                    }`}
                    type="button"
                    onClick={() => setSelectedInterviewId(item.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-[#1a1c1c]">
                        {item.jobTitle}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[14px] text-[#5f5e5e]">
                        <span className="material-symbols-outlined text-[17px]">
                          schedule
                        </span>
                        {item.dateLabel} - {item.timeLabel}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                        Người phỏng vấn
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-[#1a1c1c]">
                        {item.interviewer || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold ${statusChip(normalizedStatus)}`}
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
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-lg border border-[#e2dfde] bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:self-start">
            <div className="mb-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                Chi tiết
              </p>
              <h3 className="mt-2 text-[22px] font-semibold leading-7 text-[#1a1c1c]">
                {selectedInterview?.jobTitle ?? "Chọn lịch phỏng vấn"}
              </h3>
            </div>

            {selectedInterview ? (
              <div className="space-y-4">
                <DetailTile
                  icon="calendar_month"
                  label="Ngày phỏng vấn"
                  value={selectedInterview.dateLabel}
                  helper={selectedInterview.timeLabel}
                />
                <DetailTile
                  icon="person"
                  label="Người phỏng vấn"
                  value={selectedInterview.interviewer}
                />
                <DetailTile
                  icon="work"
                  label="Vị trí"
                  value={selectedInterview.jobTitle}
                />

                <div className="rounded-lg border border-[#e2dfde] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                    Trạng thái
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold ${statusChip(normalizeStatus(selectedInterview.status))}`}
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

                <div className="rounded-lg border border-[#efe2df] bg-[#fff8f7] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b90014]">
                    Trước buổi phỏng vấn
                  </p>
                  <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#1a1c1c]">
                    <li>Kiểm tra CV và mô tả công việc.</li>
                    <li>Chuẩn bị ví dụ dự án phù hợp.</li>
                    <li>Vào phòng họp sớm 5-10 phút nếu phỏng vấn online.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d6d1cf] p-5 text-[14px] text-[#5f5e5e]">
                Chọn một lịch để xem chi tiết.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default CandidateInterviewScreen;
