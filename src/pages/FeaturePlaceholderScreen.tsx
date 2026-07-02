type FeaturePlaceholderScreenProps = {
  title: string;
  description: string;
  variant?: "default" | "executive";
};

function FeaturePlaceholderScreen({
  title,
  description,
  variant = "default",
}: FeaturePlaceholderScreenProps) {
  if (variant === "executive") {
    return (
      <div className="sysadmin-page animate-fade-in">
        <section className="executive-panel px-5 py-8 sm:px-7 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(280px,0.42fr)] lg:items-end">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#eadfdb] bg-[#fff7f6] text-[#b90014]">
                <span className="material-symbols-outlined text-[30px]">construction</span>
              </div>
              <p className="eyebrow mt-6 text-[#b90014]">Sắp ra mắt</p>
              <h1 className="mt-2 max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.03em] text-[#1a1c1c] md:text-[38px]">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5f5e5e]">
                {description}
              </p>
            </div>
            <div className="rounded-[16px] border border-[#eadfdb] bg-[#fbf7f5] p-4">
              <div className="space-y-3" aria-hidden="true">
                <div className="h-3 w-24 rounded-full bg-[#d8cfca]" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-20 rounded-[12px] bg-white shadow-[var(--shadow-xs)]" />
                  <div className="h-20 rounded-[12px] bg-white shadow-[var(--shadow-xs)]" />
                </div>
                <div className="h-2 w-full rounded-full bg-[#eadfdb]" />
                <div className="h-2 w-3/4 rounded-full bg-[#eadfdb]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in py-10">
      <section className="card flex flex-col items-center px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1f0] to-[#ffe3e0] text-[#b90014]">
          <span className="material-symbols-outlined text-[32px]">construction</span>
        </div>
        <p className="eyebrow mt-5 text-[#b90014]">Sắp ra mắt</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-[#1a1c1c] md:text-[30px]">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#5f5e5e]">
          {description}
        </p>
      </section>
    </div>
  );
}

export default FeaturePlaceholderScreen;
