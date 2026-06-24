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
      <section className="rounded-lg border border-dashed border-[#d6d1cf] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
          Chưa hỗ trợ
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#5f5e5e]">
          {description}
        </p>
      </section>
    </div>
  );
}

export default FeaturePlaceholderScreen;
