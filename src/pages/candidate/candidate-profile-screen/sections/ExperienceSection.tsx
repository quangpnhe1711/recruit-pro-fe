import CommonSelect from "../../../../common/components/CommonSelect";
import type { Dispatch, SetStateAction } from "react";
import type { EntryDraft, ExperienceEntry } from "../types";
import { formatPeriod, monthOptions } from "../utils";

type ExperienceSectionProps = {
  canManageExperience: boolean;
  showEntryComposer: boolean;
  setShowEntryComposer: Dispatch<SetStateAction<boolean>>;
  entryDraft: EntryDraft;
  setEntryDraft: Dispatch<SetStateAction<EntryDraft>>;
  experienceEntries: ExperienceEntry[];
  onAddEntry: () => void;
};

function ExperienceSection({
  canManageExperience,
  showEntryComposer,
  setShowEntryComposer,
  entryDraft,
  setEntryDraft,
  experienceEntries,
  onAddEntry,
}: ExperienceSectionProps) {
  return (
    <section className="rounded-lg border border-[#e2dfde] bg-white p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Kinh nghiệm làm việc
        </h2>
        {canManageExperience ? (
          <button
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowEntryComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Thêm mục
          </button>
        ) : null}
      </div>

      {showEntryComposer && canManageExperience ? (
        <div className="mb-8 space-y-3 rounded border border-[#e2dfde] bg-[#f3f3f3] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder="Chức danh"
              value={entryDraft.title}
              onChange={(e) =>
                setEntryDraft((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder="Công ty / Trường"
              value={entryDraft.company}
              onChange={(e) =>
                setEntryDraft((prev) => ({
                  ...prev,
                  company: e.target.value,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CommonSelect
              value={String(entryDraft.startMonth)}
              options={monthOptions.map((month, index) => ({
                label: month,
                value: String(index + 1),
              }))}
              onValueChange={(value) =>
                setEntryDraft((prev) => ({
                  ...prev,
                  startMonth: Number(value),
                }))
              }
              className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
              menuClassName="border-[#e2dfde]"
            />
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              min={2000}
              max={new Date().getFullYear() + 1}
              placeholder="Năm bắt đầu"
              type="number"
              value={entryDraft.startYear}
              onChange={(e) =>
                setEntryDraft((prev) => ({
                  ...prev,
                  startYear: Number(e.target.value),
                }))
              }
            />
            <label className="col-span-2 flex items-center gap-2 rounded border border-[#e2dfde] bg-white px-3 py-2 text-[14px] font-semibold text-[#1a1c1c] md:col-span-1">
              <input
                checked={entryDraft.isCurrent}
                className="h-4 w-4 accent-[#b90014]"
                type="checkbox"
                onChange={(e) =>
                  setEntryDraft((prev) => ({
                    ...prev,
                    isCurrent: e.target.checked,
                  }))
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
                    setEntryDraft((prev) => ({
                      ...prev,
                      endMonth: Number(value),
                    }))
                  }
                  className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
                  menuClassName="border-[#e2dfde]"
                />
                <input
                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                  min={2000}
                  max={new Date().getFullYear() + 1}
                  placeholder="Năm kết thúc"
                  type="number"
                  value={entryDraft.endYear}
                  onChange={(e) =>
                    setEntryDraft((prev) => ({
                      ...prev,
                      endYear: Number(e.target.value),
                    }))
                  }
                />
              </>
            )}
          </div>
          <textarea
            className="min-h-[96px] w-full rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Mỗi ý một dòng"
            value={entryDraft.bullets}
            onChange={(e) =>
              setEntryDraft((prev) => ({
                ...prev,
                bullets: e.target.value,
              }))
            }
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
              type="button"
              onClick={() => setShowEntryComposer(false)}
            >
              Hủy
            </button>
            <button
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
              type="button"
              onClick={onAddEntry}
            >
              Thêm mục
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e2dfde]">
        {experienceEntries.map((entry, index) => (
          <div key={entry.id} className="relative pl-10">
            <div
              className={`absolute left-0 top-1 z-10 h-6 w-6 rounded-full border-4 border-[#f9f9f9] ${
                index === experienceEntries.length - 1
                  ? "bg-[#c8c6c5]"
                  : index === 1
                    ? "bg-[#1a1c1c]"
                    : "bg-[#b90014]"
              }`}
            />
            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-[16px] font-bold text-[#1a1c1c]">{entry.title}</h3>
              <span className="rounded bg-[#e2dfde] px-2 py-1 text-[12px] font-semibold text-[#636262]">
                {formatPeriod(entry.period)}
              </span>
            </div>
            <p className="mb-2 text-[14px] font-semibold text-[#b90014]">{entry.company}</p>
            <ul className="list-inside list-disc space-y-1 text-[14px] text-[#5f5e5e]">
              {entry.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExperienceSection;
