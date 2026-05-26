function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e2dfde] bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-10">
        <div className="flex flex-1 items-center">
          <div className="relative w-full max-w-2xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
              search
            </span>
            <input
              className="w-full rounded-none border border-[#e7bdb8] bg-[#f3f3f3] py-2 pl-10 pr-4 text-[14px] outline-none transition-colors placeholder:text-[#5f5e5e] focus:border-[#1a1c1c]"
              placeholder="Search roles, skills, or locations..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden items-center gap-4 border-r border-[#e2dfde] pr-6 md:flex">
            <button
              className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
              type="button"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
              type="button"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-semibold text-[#1a1c1c]">
                Alex Rivera
              </p>
              <p className="text-[12px] text-[#5f5e5e]">Senior Recruiter</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e2dfde] bg-[#f3f3f3] text-[12px] font-bold text-[#1a1c1c]">
              AR
            </div>
          </div>

          {/* <MockJsonButton
            className="hidden md:inline-flex"
            label="Test Mock JSON"
            payload={{
              screen: "JobListingCandidateScreen",
              featuredJobs: featuredJobs.map((job) => job.title),
              filters: filterGroups.map((group) => group.title),
            }}
          /> */}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
