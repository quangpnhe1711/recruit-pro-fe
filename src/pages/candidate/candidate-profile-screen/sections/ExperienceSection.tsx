import CommonSelect from "../../../../common/components/CommonSelect";
import type { Dispatch, SetStateAction } from "react";
import type { ValidationErrors } from "../../../../common/validation/formValidation";
import type { EntryDraft, ExperienceEntry } from "../types";
import { formatPeriod, monthOptions } from "../utils";

type ExperienceSectionProps = {
  canManageExperience: boolean;
  showEntryComposer: boolean;
  setShowEntryComposer: Dispatch<SetStateAction<boolean>>;
  entryDraft: EntryDraft;
  onEntryDraftChange: (
    field: keyof EntryDraft,
    value: string | number | boolean,
  ) => void;
  experienceEntries: ExperienceEntry[];
  onAddEntry: () => void;
  onRemoveEntry: (entryId: string) => void;
  errors: ValidationErrors;
};

function ExperienceSection({
  canManageExperience,
  showEntryComposer,
  setShowEntryComposer,
  entryDraft,
  onEntryDraftChange,
  experienceEntries,
  onAddEntry,
  onRemoveEntry,
  errors,
}: ExperienceSectionProps) {
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#f0eceb] pb-4">
        <div>
          <h2 className="section-title">Kinh nghiệm làm việc</h2>
          <p className="page-subtitle">Lịch sử công việc theo dòng thời gian.</p>
        </div>
        {canManageExperience ? (
          <button
            className="btn btn-secondary h-11"
            type="button"
            onClick={() => setShowEntryComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Thêm mục
          </button>
        ) : null}
      </div>

      {showEntryComposer && canManageExperience ? (
        <div className="animate-scale-in mb-6 space-y-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className={`input-field h-11 ${errors.title ? "border-[#dc2626]" : ""}`}
              placeholder="Chức danh"
              value={entryDraft.title}
              onChange={(e) => onEntryDraftChange("title", e.target.value)}
            />
            <input
              className={`input-field h-11 ${errors.company ? "border-[#dc2626]" : ""}`}
              placeholder="Công ty / Trường"
              value={entryDraft.company}
              onChange={(e) => onEntryDraftChange("company", e.target.value)}
            />
          </div>
          {errors.title || errors.company ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <p className="text-sm text-[#dc2626]">{errors.title || " "}</p>
              <p className="text-sm text-[#dc2626]">{errors.company || " "}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CommonSelect
              value={String(entryDraft.startMonth)}
              options={monthOptions.map((month, index) => ({
                label: month,
                value: String(index + 1),
              }))}
              onValueChange={(value) =>
                onEntryDraftChange("startMonth", Number(value))
              }
              className="h-11 rounded-[10px] border border-[#dcd7d5] bg-white text-[14px] shadow-none focus:border-[#b90014]"
              menuClassName="border-[#ececec]"
            />
            <input
              className="input-field h-11"
              min={2000}
              max={new Date().getFullYear() + 1}
              placeholder="Năm bắt đầu"
              type="number"
              value={entryDraft.startYear}
              onChange={(e) =>
                onEntryDraftChange("startYear", Number(e.target.value))
              }
            />
            <label className="col-span-2 flex h-11 items-center gap-2 rounded-[10px] border border-[#dcd7d5] bg-white px-3 text-[14px] font-semibold text-[#1a1c1c] md:col-span-1">
              <input
                checked={entryDraft.isCurrent}
                className="h-4 w-4 accent-[#b90014]"
                type="checkbox"
                onChange={(e) =>
                  onEntryDraftChange("isCurrent", e.target.checked)
                }
              />
              Hiện tại
            </label>
            {entryDraft.isCurrent ? null : (
              <>
                <CommonSelect
                  value={String(entryDraft.endMonth)}
                  options={monthOptions.map((month, index) => ({
                    label: month,
                    value: String(index + 1),
                  }))}
                  onValueChange={(value) =>
                    onEntryDraftChange("endMonth", Number(value))
                  }
                  className="h-11 rounded-[10px] border border-[#dcd7d5] bg-white text-[14px] shadow-none focus:border-[#b90014]"
                  menuClassName="border-[#ececec]"
                />
                <input
                  className="input-field h-11"
                  min={2000}
                  max={new Date().getFullYear() + 1}
                  placeholder="Năm kết thúc"
                  type="number"
                  value={entryDraft.endYear}
                  onChange={(e) =>
                    onEntryDraftChange("endYear", Number(e.target.value))
                  }
                />
              </>
            )}
          </div>
          <textarea
            className={`input-field min-h-[96px] resize-none ${errors.bullets ? "border-[#dc2626]" : ""}`}
            placeholder="Mỗi ý một dòng"
            value={entryDraft.bullets}
            onChange={(e) => onEntryDraftChange("bullets", e.target.value)}
          />
          {errors.bullets ? (
            <p className="text-sm text-[#dc2626]">{errors.bullets}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setShowEntryComposer(false)}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary h-11"
              type="button"
              onClick={onAddEntry}
            >
              Thêm mục
            </button>
          </div>
        </div>
      ) : null}

      <div className="stagger relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#ececec]">
        {experienceEntries.map((entry) => (
          <div key={entry.id} className="relative pl-7">
            <div className="absolute left-0 top-1.5 z-10 h-4 w-4 rounded-full border-4 border-white bg-[#b90014] shadow-[0_0_0_1px_#ececec]" />
            <div className="mb-1.5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <h3 className="text-[16px] font-semibold text-[#1a1c1c]">{entry.title}</h3>
                <span className="badge bg-[#f1eeed] text-[#5f5e5e]">
                  {formatPeriod(entry.period)}
                </span>
              </div>
              {canManageExperience ? (
                <button
                  className="self-start text-[12px] font-semibold text-[#b90014] hover:underline"
                  type="button"
                  onClick={() => onRemoveEntry(entry.id)}
                >
                  Xóa mục
                </button>
              ) : null}
            </div>
            <p className="mb-2 text-[14px] font-semibold text-[#b90014]">{entry.company}</p>
            <ul className="space-y-1.5 text-[14px] leading-6 text-[#5f5e5e]">
              {entry.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b90014]/40" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExperienceSection;
