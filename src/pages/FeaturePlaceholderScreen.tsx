type FeaturePlaceholderScreenProps = {
  title: string;
  description: string;
};

function FeaturePlaceholderScreen({
  title,
  description,
}: FeaturePlaceholderScreenProps) {
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
