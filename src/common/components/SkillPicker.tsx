import CommonSelect, { type CommonSelectOption } from "./CommonSelect";

type SkillPickerProps = {
  options: CommonSelectOption[];
  selectedValues: string[];
  selectedLabelByValue?: Record<string, string>;
  placeholder?: string;
  emptyLabel?: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  disabled?: boolean;
};

function SkillPicker({
  options,
  selectedValues,
  selectedLabelByValue,
  placeholder = "Chọn kỹ năng",
  emptyLabel = "Chưa có kỹ năng nào được chọn.",
  onAdd,
  onRemove,
  disabled = false,
}: SkillPickerProps) {
  const availableOptions = options.filter((option) => !selectedValues.includes(option.value));
  const labelMap = options.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, { ...(selectedLabelByValue ?? {}) });

  return (
    <div className="space-y-3">
      <CommonSelect
        disabled={disabled || availableOptions.length === 0}
        options={availableOptions}
        placeholder={availableOptions.length === 0 ? "Đã chọn tất cả kỹ năng" : placeholder}
        value=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value) {
            return;
          }

          onAdd(value);
        }}
      />

      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-dashed border-[#e7bdb8] bg-[#fff8f7] px-3 py-3">
        {selectedValues.length === 0 ? (
          <span className="text-[13px] text-[#7c706d]">{emptyLabel}</span>
        ) : (
          selectedValues.map((value) => (
            <button
              key={value}
              className="inline-flex items-center gap-2 rounded-full border border-[#f1c0c5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#b90014] transition-colors hover:border-[#b90014]"
              type="button"
              onClick={() => onRemove(value)}
            >
              <span>{labelMap[value] ?? value}</span>
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default SkillPicker;
