type FeaturePlaceholderScreenProps = {
  title: string;
  description: string;
};

function FeaturePlaceholderScreen({
  title,
  description,
}: FeaturePlaceholderScreenProps) {
  return (
    <div className="w-full px-4 py-10 md:px-10">
      <section className="rounded-xl border border-[#e2dfde] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
          Workflow Alignment
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#5f5e5e]">
          {description}
        </p>
      </section>
    </div>
  );
}

export default FeaturePlaceholderScreen;
