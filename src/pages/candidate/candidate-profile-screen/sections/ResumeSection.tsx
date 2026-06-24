import type { ChangeEvent } from "react";
import type { CandidateProfileResponseDto } from "../../../../services/candidate/candidateService";
import { formatSimpleDate } from "../utils";

type ResumeSectionProps = {
  canManageResume: boolean;
  resumeMeta: CandidateProfileResponseDto["resume"] | null;
  resumeHistory: CandidateProfileResponseDto["resumeHistory"];
  resumeFile: File | null;
  isParsingResume: boolean;
  onResumeFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearSelectedResumeFile: () => void;
  onParseResume: () => void;
  onOpenCurrentResume: () => void;
  onDownloadCurrentResume: () => void;
  onOpenResumeHistoryItem: (resumeId: string, fileUrl: string) => void;
};

function ResumeSection({
  canManageResume,
  resumeMeta,
  resumeHistory,
  resumeFile,
  isParsingResume,
  onResumeFileChange,
  onClearSelectedResumeFile,
  onParseResume,
  onOpenCurrentResume,
  onDownloadCurrentResume,
  onOpenResumeHistoryItem,
}: ResumeSectionProps) {
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-[#f0eceb] pb-4">
        <div>
          <h2 className="section-title">CV &amp; Phân tích hồ sơ</h2>
          <p className="page-subtitle">Tải CV và để hệ thống phân tích thành hồ sơ cấu trúc.</p>
        </div>
        {resumeFile ? (
          <button
            className="badge bg-[#fff4f6] text-[#b90014] hover:bg-[#ffe7ec]"
            type="button"
            onClick={onClearSelectedResumeFile}
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Bỏ file đã chọn
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-[#e2dfde] bg-[linear-gradient(135deg,#fffdfd_0%,#fff5f6_52%,#fdfdfd_100%)] p-5 shadow-[0_20px_45px_rgba(185,0,20,0.06)]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b90014]/10">
              <span className="material-symbols-outlined text-[32px] text-[#b90014]">
                picture_as_pdf
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[18px] font-semibold text-[#1a1c1c]">
                  {resumeMeta?.fileName ?? "Chưa có CV chính thức"}
                </p>
                {resumeMeta?.isCurrent ? (
                  <span className="rounded-full bg-[#b90014] px-3 py-1 text-[11px] font-semibold text-white">
                    CV đang dùng
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] leading-6 text-[#5f5e5e]">
                {resumeMeta?.uploadedAt
                  ? `Cập nhật lần cuối ngày ${formatSimpleDate(resumeMeta.uploadedAt)}. Đây là bản CV hệ thống sẽ ưu tiên khi bạn ứng tuyển.`
                  : "Tải CV mới nhất để hệ thống nhận diện đúng kinh nghiệm, kỹ năng và hỗ trợ điền hồ sơ nhanh hơn."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className="rounded-full border border-[#e8d7da] bg-white px-3 py-1 text-[#7b2130]">
                  {resumeMeta ? `Phiên bản v${resumeMeta.version}` : "PDF, DOC, DOCX"}
                </span>
                <span className="rounded-full border border-[#e8d7da] bg-white px-3 py-1 text-[#7b2130]">
                  Parse sang hồ sơ cấu trúc
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1c1c] transition-colors hover:border-[#b90014] hover:text-[#b90014] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!resumeMeta}
              onClick={onOpenCurrentResume}
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Xem CV
            </button>
            {canManageResume ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1c1c] transition-colors hover:border-[#b90014] hover:text-[#b90014] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={!resumeMeta}
                onClick={onDownloadCurrentResume}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Tải xuống
              </button>
            ) : null}
          </div>
        </div>

        <div className={`relative ${canManageResume ? "" : "pointer-events-none opacity-60"}`}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={onResumeFileChange}
            disabled={!canManageResume}
          />

          <button
            className="flex min-h-[188px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#d9d6d5] bg-[#faf7f7] px-6 text-center transition-colors hover:border-[#b90014] hover:bg-[#fff7f8]"
            type="button"
          >
            <span className="material-symbols-outlined mb-3 text-[36px] text-[#b90014]">
              cloud_upload
            </span>
            <span className="text-[15px] font-semibold text-[#1a1c1c]">
              {resumeFile ? "Đã chọn CV mới" : "Kéo thả hoặc bấm để tải CV"}
            </span>
            <span className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">
              {resumeFile
                ? resumeFile.name
                : "Ưu tiên CV định dạng như ứng viên gửi thực tế để kết quả parse sát hơn."}
            </span>
            <span className="mt-4 rounded-full bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b2130]">
              PDF, DOC, DOCX
            </span>
          </button>
        </div>
      </div>

      {resumeFile ? (
        <div className="mt-5 rounded-[20px] border border-[#f1d7db] bg-[#fff8f8] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[15px] font-semibold text-[#b90014]">
                Xem trước dữ liệu CV trước khi ghi vào hồ sơ
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b90014] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isParsingResume}
              onClick={onParseResume}
            >
              <span className="material-symbols-outlined text-[18px]">psychiatry</span>
              {isParsingResume ? "Đang phân tích CV..." : "Phân tích CV"}
            </button>
          </div>
        </div>
      ) : null}

      {resumeHistory.length ? (
        <div className="mt-6 space-y-3">
          <p className="eyebrow">Lịch sử CV</p>
          {resumeHistory.map((resume) => (
            <button
              key={resume.id}
              className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-[#ececec] bg-white px-4 py-3 text-left transition-all hover:border-[#b90014] hover:bg-[#fffafa]"
              type="button"
              onClick={() => onOpenResumeHistoryItem(resume.id, resume.fileUrl)}
            >
              <div>
                <p className="text-[14px] font-semibold text-[#1a1c1c]">
                  v{resume.version} • {resume.fileName}
                </p>
                <p className="text-[12px] text-[#5f5e5e]">
                  {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-[12px] font-semibold text-[#b90014]">
                {resume.isCurrent ? "Đang dùng" : "Mở"}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ResumeSection;
