import AppHeader from "../../common/components/layout/AppHeader";
import SideNavBar from "../../common/components/layout/SideNavBar";

type StatCard = {
  icon: string;
  iconClassName: string;
  label: string;
  value: string;
  helper: string;
};

type RecommendedJob = {
  icon: string;
  title: string;
  meta: string;
  tag: string;
  chips: string[];
  layout?: "compact";
  actionLabel: string;
};

const statCards: StatCard[] = [
  {
    icon: "assignment",
    iconClassName: "text-[#b90014]",
    label: "Applied Jobs",
    value: "04",
    helper: "+1 since last week",
  },
  {
    icon: "event",
    iconClassName: "text-[#005f93]",
    label: "Interviews",
    value: "01",
    helper: "Next scheduled today at 2:00 PM",
  },
  {
    icon: "notifications_active",
    iconClassName: "text-[#1a1c1c]",
    label: "Unread",
    value: "02",
    helper: "Feedback received for UX Designer",
  },
];

const recommendedJobs: RecommendedJob[] = [
  {
    icon: "hub",
    title: "Staff UX Researcher",
    meta: "Remote • $140k - $180k",
    tag: "Full Time",
    chips: ["User Testing", "Figma", "Strategy"],
    actionLabel: "Quick Apply",
  },
  {
    icon: "architecture",
    title: "Design Systems Engineer",
    meta: "New York, NY • $130k - $165k",
    tag: "Hybrid",
    chips: ["React", "Tailwind", "Typescript"],
    actionLabel: "Quick Apply",
  },
  {
    icon: "token",
    title: "Visual Design Lead",
    meta: "Remote • Hourly",
    tag: "Contract",
    chips: ["Branding", "Art Direction"],
    layout: "compact",
    actionLabel: "Apply Now",
  },
];

function DashboardCandidateScreen() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <SideNavBar
        variant="internal"
        brand={{ subtitle: "Internal Portal", to: "/candidate/dashboard" }}
        items={[
          { icon: "dashboard", label: "Dashboard", to: "/candidate/dashboard" },
          { icon: "work", label: "Jobs", to: "/candidate/jobs" },
          {
            icon: "description",
            label: "Applications",
            to: "/candidate/my-applications",
          },
          {
            icon: "analytics",
            label: "Analytics",
            to: "/candidate/dashboard#analytics",
          },
        ]}
        bottomItems={[
          { icon: "settings", label: "Settings", to: "/candidate/settings" },
          { icon: "help", label: "Support", to: "/candidate/support" },
        ]}
        cta={{ label: "Post New Job" }}
        showUserCard={false}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader
          searchPlaceholder="Search jobs, candidates..."
          userName="Alex Thompson"
          userRole="Senior Candidate"
          avatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDi8gQSTnAKzoLYLVDE3p6FrOCz9emlaZJkEjoP7yLKXy6iIwnvusaVic9JF-0RN39e7BSACaCmlF-wWjxH1LglReK9JM3cJgYMkSJM5TliZyHkNYEUudCoYDUutoEuxNGHN15jLmZMvANIrWyAd2xgemxuucIer96N0w1ij5ac2wXH-vEEn3aPIQVZAslh9KPNvpYJ01hQKk7kSH4KHXbKmVhNG7lh2bl-cKMv8pwJnoGPPSuqazPG3p-2Zifs3wQLGZdos4f0fw"
        />

        <main className="flex-1">
          <section className="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-10">
            <div className="mb-10">
              <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                Welcome back, Alex
              </h2>
              <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
                You have 1 interview scheduled for today and 2 new notifications.
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
                      {card.label === "Applied Jobs" ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-[#b90014]">
                            trending_up
                          </span>
                          <span>{card.helper}</span>
                        </>
                      ) : (
                        <span>{card.helper}</span>
                      )}
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
                    Upcoming Interview
                  </h3>
                </div>

                <div className="flex h-full flex-col border-l-4 border-[#b90014] bg-[#1A1A1A] p-6 text-white">
                  <div className="mb-6">
                    <span className="rounded-full bg-[#b90014] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      Today
                    </span>
                    <h4 className="mt-4 text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                      2:00 PM
                    </h4>
                    <p className="text-[16px] leading-6 text-[#c8c6c5]">
                      Oct 24, 2024
                    </p>
                  </div>

                  <div className="mb-8 space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                        Job Title
                      </span>
                      <span className="text-[16px] font-bold">
                        Senior Product Designer
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                        Interviewer
                      </span>
                      <span className="text-[16px]">
                        Sarah Jenkins, Design Lead
                      </span>
                    </div>
                  </div>

                  <a
                    className="mt-auto flex w-full items-center justify-center gap-2 bg-[#b90014] py-4 text-[12px] font-bold uppercase tracking-[0.18em] transition-colors hover:brightness-110"
                    href="#"
                  >
                    <span className="material-symbols-outlined">video_call</span>
                    Join Meeting
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
                      Recommended Jobs
                    </h3>
                  </div>
                  <a
                    className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
                    href="#"
                  >
                    View All Listings
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {recommendedJobs.map((job) => {
                    const isCompact = job.layout === "compact";

                    if (isCompact) {
                      return (
                        <div
                          key={job.title}
                          className="border border-[#e2dfde] bg-white p-6 md:col-span-2"
                        >
                          <div className="flex items-center gap-6">
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center border border-[#e2dfde] bg-[#eeeeee]">
                              <span className="material-symbols-outlined text-4xl text-[#b90014]">
                                {job.icon}
                              </span>
                            </div>

                            <div className="flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <h4 className="text-[16px] font-bold text-[#1a1c1c]">
                                  {job.title}
                                </h4>
                                <span className="bg-[#e2dfde]/30 px-2 py-1 text-[10px] font-bold uppercase text-[#5f5e5e]">
                                  {job.tag}
                                </span>
                              </div>
                              <p className="mb-2 text-[14px] text-[#5f5e5e]">
                                {job.meta}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {job.chips.map((chip) => (
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
                              {job.actionLabel}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={job.title}
                        className="border border-[#e2dfde] bg-white p-6 transition-shadow hover:shadow-sm"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center border border-[#e2dfde] bg-[#eeeeee]">
                            <span className="material-symbols-outlined text-[#b90014]">
                              {job.icon}
                            </span>
                          </div>
                          <span className="bg-[#e2dfde]/30 px-2 py-1 text-[10px] font-bold uppercase text-[#5f5e5e]">
                            {job.tag}
                          </span>
                        </div>

                        <h4 className="mb-1 text-[16px] font-bold text-[#1a1c1c] transition-colors hover:text-[#b90014]">
                          {job.title}
                        </h4>
                        <p className="mb-4 text-[14px] text-[#5f5e5e]">
                          {job.meta}
                        </p>

                        <div className="mb-6 flex flex-wrap gap-2">
                          {job.chips.map((chip) => (
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
                          {job.actionLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-12 border-t border-[#e2dfde] bg-[#f3f3f3] py-8">
            <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-10">
              <div>
                <p className="text-[16px] font-semibold text-[#1a1c1c]">
                  RecruitPro Internal
                </p>
                <p className="mt-1 text-[14px] text-[#5f5e5e]">
                  © 2024 RecruitPro Internal. All rights reserved. For authorized
                  personnel only.
                </p>
              </div>

              <nav className="flex flex-wrap gap-6">
                {[
                  "Privacy Policy",
                  "Terms of Service",
                  "Security Disclosure",
                  "Internal Helpdesk",
                ].map((label) => (
                  <a
                    key={label}
                    className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e] underline hover:text-[#1a1c1c]"
                    href="#"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default DashboardCandidateScreen;
