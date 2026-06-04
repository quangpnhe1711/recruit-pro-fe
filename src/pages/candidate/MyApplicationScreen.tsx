import { useState, useMemo, useEffect } from "react";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import CommonPagination from "../../common/components/CommonPagination";
import { candidateService } from "../../services/candidate/candidateService";

type ApplicationItem = {
  icon: string;
  title: string;
  department: string;
  appliedDate: string;
  status: string;
  statusClass: string;
  nextStep: string;
  actionLabel: string;
  actionClass: string;
};

const summaryCards = [
  { label: "Total", value: 0 },
  { label: "Active", value: 0 },
  { label: "Closed", value: 0 },
];

function buildApplicationTableColumns(): TableColumn<ApplicationItem>[] {
  return [
    {
      key: "title",
      header: "Job & Department",
      renderCell: (item) => (
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#e2dfde] bg-white">
            <span className="material-symbols-outlined text-[#b90014]">
              {item.icon}
            </span>
          </div>
          <div>
            <h3 className="text-[20px] font-semibold leading-7 hover:text-[#b90014]">
              {item.title}
            </h3>
            <p className="text-[14px] leading-5 text-[#5f5e5e]">
              {item.department}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "appliedDate",
      header: "Applied Date",
      renderCell: (item) => (
        <span className="text-[14px] text-[#5f5e5e]">{item.appliedDate}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderCell: (item) => (
        <span
          className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] ${item.statusClass}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "nextStep",
      header: "Next Step",
      renderCell: (item) => (
        <span className="text-[14px] italic text-[#5f5e5e]">
          {item.nextStep}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      alignRight: true,
      renderCell: (item) => (
        <div className="flex justify-end gap-3">
          {item.actionLabel === "Accept Offer" ? (
            <button
              className={`px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors ${item.actionClass}`}
              type="button"
            >
              {item.actionLabel}
            </button>
          ) : null}
          <button
            className="border-b-2 border-transparent text-[12px] font-bold text-[#1a1c1c] transition-colors hover:border-[#b90014]"
            type="button"
          >
            View Detail
          </button>
          <button
            className="text-[12px] font-bold text-[#ba1a1a] transition-opacity hover:opacity-70"
            type="button"
          >
            {item.actionLabel === "Accept Offer"
              ? "Withdraw"
              : item.actionLabel}
          </button>
        </div>
      ),
    },
  ];
}

function MyApplicationScreen() {
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [summary, setSummary] = useState(summaryCards);
  const pageSize = 3;
  const totalItems = applications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pageSlice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return applications.slice(start, start + pageSize);
  }, [page]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  useEffect(() => {
    let mounted = true;

    candidateService
      .getApplications()
      .then((res) => {
        if (!mounted) return;

        const items = (res.data ?? []).map((item: any, index) => ({
          icon: ["work", "terminal", "star"][index % 3],
          title: item.jobTitle,
          department: item.companyOrDepartment,
          appliedDate: item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : "",
          status: item.status,
          statusClass:
            item.status === "Interviewing"
              ? "bg-[#005f93]/10 text-[#005f93]"
              : item.status === "Offered"
                ? "bg-[#001d32]/10 text-[#004b74]"
                : "bg-[#e2dfde] text-[#636262]",
          nextStep: item.nextStep,
          actionLabel: item.availableActions?.includes("acceptOffer") ? "Accept Offer" : "Withdraw",
          actionClass: item.availableActions?.includes("acceptOffer")
            ? "bg-[#b90014] text-white hover:bg-[#93000d]"
            : "text-[#ba1a1a]",
        }));

        setApplications(items);
        const extra = res.extra as any;
        if (extra?.summary) {
          setSummary([
            { label: "Total", value: extra.summary.total },
            { label: "Active", value: extra.summary.active },
            { label: "Closed", value: extra.summary.closed },
          ]);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  function goTo(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-10 md:py-10">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-[32px] font-semibold leading-10 tracking-[-0.01em]">
            My Applications
          </h1>
          <p className="text-[14px] leading-5 text-[#5f5e5e]">
            Manage and track your active recruitment journeys across the
            RecruitPro network.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {summary.map((card) => (
            <div
              key={card.label}
              className="min-w-[120px] border border-[#e2dfde] bg-white p-4 text-center"
            >
              <span className="block text-[32px] font-bold text-[#b90014]">
                {card.value}
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                {card.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4 bg-[#f3f3f3] p-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1a1c1c]">
            Filter By:
          </span>
          <select className="border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]">
            <option>All Statuses</option>
            <option>Under Review</option>
            <option>Interviewing</option>
            <option>Offered</option>
            <option>Rejected</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select className="border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]">
            <option>Sort by: Applied Date</option>
            <option>Sort by: Job Title</option>
            <option>Sort by: Company</option>
          </select>
        </div>
        <div className="flex-1" />
        <div className="relative w-full md:w-72">
          <input
            className="w-full border border-[#e2dfde] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Search applications..."
            type="text"
          />
        </div>
      </div>

      <section className="overflow-hidden border border-[#e2dfde] bg-white">
        <CommonTable
          columns={buildApplicationTableColumns()}
          data={pageSlice}
          keyExtractor={(item) => item.title}
          loading={false}
          emptyMessage="No applications found."
          zebra
          hover
        />
      </section>

      <CommonPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={goTo}
      />
    </div>
  );
}

export default MyApplicationScreen;
