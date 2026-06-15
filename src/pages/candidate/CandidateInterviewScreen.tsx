import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { candidateService, type CandidateInterviewItemDto } from "../../services/candidate/candidateService";

function normalizeStatus(status: string) {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "canceled":
      return "Cancelled";
    default:
      return status;
  }
}

function statusChip(status: string) {
  switch (status) {
    case "Scheduled":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Completed":
      return "bg-[#b90014]/10 text-[#b90014]";
    case "Cancelled":
      return "bg-[#e2dfde] text-[#5f5e5e]";
    default:
      return "bg-[#f3f3f3] text-[#5f5e5e]";
  }
}

function CandidateInterviewScreen() {
  const [items, setItems] = useState<CandidateInterviewItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    candidateService
      .getInterviews()
      .then((response) => {
        if (!mounted) {
          return;
        }

        setItems(response.data ?? []);
      })
      .catch(() => {
        if (mounted) {
          toast.error("Unable to load interviews");
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

  const stats = useMemo(() => {
    const scheduled = items.filter((item) => item.status.toLowerCase() === "scheduled").length;
    const completed = items.filter((item) => item.status.toLowerCase() === "completed").length;
    const nextInterview = items
      .filter((item) => new Date(item.startAt).getTime() >= Date.now())
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())[0];

    return {
      scheduled,
      completed,
      nextInterview,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Loading interviews..." />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-10">
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
          My Interviews
        </h1>
        <p className="mt-2 text-[14px] text-[#5f5e5e]">
          Track your scheduled interviews, meeting details, and completed rounds.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Scheduled</p>
          <p className="mt-3 text-[32px] font-semibold text-[#005f93]">{stats.scheduled}</p>
        </div>
        <div className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Completed</p>
          <p className="mt-3 text-[32px] font-semibold text-[#b90014]">{stats.completed}</p>
        </div>
        <div className="rounded-lg border border-[#e2dfde] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Next Interview</p>
          <p className="mt-3 text-[18px] font-semibold text-[#1a1c1c]">
            {stats.nextInterview ? stats.nextInterview.dateLabel : "No upcoming interview"}
          </p>
          <p className="mt-1 text-[14px] text-[#5f5e5e]">
            {stats.nextInterview ? `${stats.nextInterview.jobTitle} • ${stats.nextInterview.timeLabel}` : "You are all caught up for now."}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#e2dfde] bg-white">
        <div className="border-b border-[#e2dfde] px-6 py-4">
          <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Interview Timeline</h2>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-10 text-[14px] text-[#5f5e5e]">No interviews have been scheduled yet.</div>
        ) : (
          <div className="divide-y divide-[#e2dfde]">
            {items.map((item) => {
              const normalizedStatus = normalizeStatus(item.status);
              return (
                <div key={item.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-center">
                  <div>
                    <p className="text-[16px] font-semibold text-[#1a1c1c]">{item.jobTitle}</p>
                    <p className="mt-1 text-[14px] text-[#5f5e5e]">
                      {item.dateLabel} • {item.timeLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">Interviewer</p>
                    <p className="mt-1 text-[14px] text-[#1a1c1c]">{item.interviewer}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusChip(normalizedStatus)}`}>
                      {normalizedStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default CandidateInterviewScreen;
