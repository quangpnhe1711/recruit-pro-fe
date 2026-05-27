
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

const applications: ApplicationItem[] = [
  {
    icon: "work",
    title: "Lead Product Designer",
    department: "Luvina Tech - Design Team",
    appliedDate: "Oct 24, 2023",
    status: "Interviewing",
    statusClass: "bg-[#005f93]/10 text-[#005f93]",
    nextStep: "Schedule technical interview",
    actionLabel: "Withdraw",
    actionClass: "text-[#ba1a1a]",
  },
  {
    icon: "terminal",
    title: "Senior Backend Engineer",
    department: "Nexus Systems - Infrastructure",
    appliedDate: "Oct 28, 2023",
    status: "Under Review",
    statusClass: "bg-[#e2dfde] text-[#636262]",
    nextStep: "Awaiting recruiter feedback",
    actionLabel: "Withdraw",
    actionClass: "text-[#ba1a1a]",
  },
  {
    icon: "star",
    title: "Staff Frontend Architect",
    department: "InnovaSoft - Core Web",
    appliedDate: "Oct 12, 2023",
    status: "Offered",
    statusClass: "bg-[#001d32]/10 text-[#004b74]",
    nextStep: "Review & sign offer letter",
    actionLabel: "Accept Offer",
    actionClass: "bg-[#b90014] text-white hover:bg-[#93000d]",
  },
];

const summaryCards = [
  { label: "Total", value: 12 },
  { label: "Active", value: 4 },
  { label: "Closed", value: 8 },
];

function MyApplicationScreen() {
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
              {summaryCards.map((card) => (
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
            <div className="hidden grid-cols-12 bg-[#1a1c1c] px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.05em] text-white lg:grid">
              <div className="col-span-4">Job &amp; Department</div>
              <div className="col-span-2">Applied Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Next Step</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#e2dfde]">
              {applications.map((item, index) => (
                <div
                  key={item.title}
                  className={`group grid grid-cols-1 items-center gap-4 px-6 py-6 transition-transform hover:translate-x-1 lg:grid-cols-12 ${
                    index % 2 === 1 ? "bg-[#f3f3f3]" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4 lg:col-span-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#e2dfde] bg-white">
                      <span className="material-symbols-outlined text-[#b90014]">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[20px] font-semibold leading-7 group-hover:text-[#b90014]">
                        {item.title}
                      </h3>
                      <p className="text-[14px] leading-5 text-[#5f5e5e]">
                        {item.department}
                      </p>
                    </div>
                  </div>

                  <div className="text-[14px] text-[#5f5e5e] lg:col-span-2">
                    <span className="lg:hidden font-bold text-[#1a1c1c]">
                      Applied:{" "}
                    </span>
                    {item.appliedDate}
                  </div>

                  <div className="lg:col-span-2">
                    <span
                      className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] ${item.statusClass}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-[14px] italic text-[#5f5e5e] lg:col-span-2">
                    {item.nextStep}
                  </div>

                  <div className="flex justify-end gap-3 lg:col-span-2">
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
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 px-1 md:flex-row md:items-center">
            <p className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
              Showing 1 to 3 of 12 applications
            </p>
            <div className="flex gap-2">
              <button
                className="flex h-10 w-10 items-center justify-center border border-[#e2dfde] transition-colors hover:bg-[#f3f3f3]"
                type="button"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center border border-[#1a1c1c] bg-[#1a1c1c] font-bold text-white"
                type="button"
              >
                1
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center border border-[#e2dfde] transition-colors hover:bg-[#f3f3f3]"
                type="button"
              >
                2
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center border border-[#e2dfde] transition-colors hover:bg-[#f3f3f3]"
                type="button"
              >
                3
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center border border-[#e2dfde] transition-colors hover:bg-[#f3f3f3]"
                type="button"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
    </div>
  );
}

export default MyApplicationScreen;
