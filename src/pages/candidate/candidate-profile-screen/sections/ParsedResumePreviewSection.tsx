import type { CandidateResumeParseResponseDto } from "../../../../services/candidate/candidateService";
import { getSkillChipClass } from "../../../../common/utils/jobPresentation";
import {
  formatDateRange,
  formatMonthYear,
  formatSimpleDate,
  getCountLabel,
  renderRichBulletText,
} from "../utils";

type ParsedResumePreviewSectionProps = {
  parsedResumePreview: CandidateResumeParseResponseDto;
  onApply: () => void;
  onDismiss: () => void;
};

function ParsedResumePreviewSection({
  parsedResumePreview,
  onApply,
  onDismiss,
}: ParsedResumePreviewSectionProps) {
  return (
    <div className="mt-6 rounded-[28px] border border-[#f1d7db] bg-[linear-gradient(180deg,#fff7f8_0%,#ffffff_100%)] p-4 shadow-[0_24px_60px_rgba(185,0,20,0.10)] md:p-6">
      <div className="rounded-[24px] border border-[#f3e4e7] bg-white p-5 md:p-7">
        <div className="flex flex-col gap-5 border-b border-[#f0e4e6] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f1d7db] bg-[#fff7f8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b90014]">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {parsedResumePreview.usedAi ? "AI Parsing" : parsedResumePreview.parsingMode}
              </span>
              {parsedResumePreview.modelName ? (
                <span className="rounded-full bg-[#fff0f2] px-3 py-1 text-[11px] font-semibold text-[#7a4b53]">
                  {parsedResumePreview.modelName}
                </span>
              ) : null}
              <span className="rounded-full bg-[#ffe8ec] px-3 py-1 text-[11px] font-semibold text-[#8a1020]">
                Bản nháp từ CV
              </span>
            </div>

            <h3 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#301419]">
              {parsedResumePreview.profile.name || "Ứng viên chưa rõ tên"}
            </h3>
            <p className="mt-2 text-[17px] font-medium text-[#b90014]">
              {parsedResumePreview.profile.headline || "Chưa nhận diện được headline nghề nghiệp"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-[#7a4b53]">
              {parsedResumePreview.profile.email ? (
                <span className="rounded-full border border-[#f0e4e6] bg-[#fff9fa] px-3 py-1">
                  {parsedResumePreview.profile.email}
                </span>
              ) : null}
              {parsedResumePreview.profile.phone ? (
                <span className="rounded-full border border-[#f0e4e6] bg-[#fff9fa] px-3 py-1">
                  {parsedResumePreview.profile.phone}
                </span>
              ) : null}
              {parsedResumePreview.profile.location ? (
                <span className="rounded-full border border-[#f0e4e6] bg-[#fff9fa] px-3 py-1">
                  {parsedResumePreview.profile.location}
                </span>
              ) : null}
            </div>
          </div>

          <div className="w-full max-w-[320px] rounded-[20px] border border-[#f1d7db] bg-[#fff8f8] p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7a4b53]">
              Tình trạng parse
            </p>
            {!parsedResumePreview.usedAi && parsedResumePreview.aiFallbackReason ? (
              <div className="mt-3 rounded-xl border border-[#ffd7dc] bg-[#fff4f6] px-4 py-3 text-[13px] leading-6 text-[#8a1020]">
                AI chưa được áp dụng ở lượt này: {parsedResumePreview.aiFallbackReason}
              </div>
            ) : (
              <p className="mt-3 text-[13px] leading-6 text-[#7a4b53]">
                Dữ liệu đã được tách thành các khối giống CV tiêu chuẩn để bạn kiểm tra nhanh
                trước khi cập nhật hồ sơ chính thức.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <button
                className="w-full rounded-full bg-[#b90014] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:brightness-110"
                type="button"
                onClick={onApply}
              >
                Áp dụng vào biểu mẫu
              </button>
              <button
                className="w-full rounded-full border border-[#e7c8cd] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#8a1020] transition-colors hover:bg-[#fff4f6]"
                type="button"
                onClick={onDismiss}
              >
                Đóng bản parse
              </button>
            </div>
          </div>
        </div>

        {parsedResumePreview.notes.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {parsedResumePreview.notes.map((note) => (
              <span
                key={note}
                className="inline-flex rounded-full border border-[#f1d7db] bg-[#fff7f8] px-3 py-1 text-[12px] font-medium text-[#b90014]"
              >
                {note}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Kỹ năng</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.skills.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.skills.length, "mục được nhận diện")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Kinh nghiệm</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.experienceEntries.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.experienceEntries.length, "vai trò công việc")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Dự án</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.projects.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.projects.length, "dự án liên quan")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Học vấn</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.educations.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.educations.length, "chương trình đào tạo")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
          <div className="space-y-7">
            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  Tóm tắt nghề nghiệp
                </p>
              </div>
              <p className="mt-4 text-[14px] leading-7 text-[#314956]">
                {parsedResumePreview.profile.bio ||
                  "Chưa trích xuất được phần giới thiệu rõ ràng từ CV này. Bạn có thể áp dụng bản nháp rồi bổ sung thêm trong biểu mẫu."}
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  Kinh nghiệm làm việc
                </p>
              </div>
              <div className="mt-5 space-y-5">
                {parsedResumePreview.experienceEntries.length ? (
                  parsedResumePreview.experienceEntries.map((entry) => (
                    <article
                      key={entry.id}
                      className="relative border-l-2 border-[#f1d7db] pl-5"
                    >
                      <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#b90014]" />
                      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h4 className="text-[17px] font-semibold text-[#18364a]">{entry.title}</h4>
                          <p className="text-[14px] font-medium text-[#b90014]">{entry.company}</p>
                        </div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                          {formatDateRange(entry.period)}
                        </p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {entry.bullets.map((bullet, index) => (
                          <p
                            key={`${entry.id}-${index}`}
                            className="text-[14px] leading-7 text-[#314956]"
                          >
                            {bullet}
                          </p>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[#6c8191]">
                    Chưa nhận diện được kinh nghiệm làm việc từ CV này.
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  Dự án nổi bật
                </p>
              </div>
              <div className="mt-5 grid gap-4">
                {parsedResumePreview.projects.length ? (
                  parsedResumePreview.projects.map((project) => (
                    <article
                      key={project.id}
                      className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h4 className="text-[16px] font-semibold text-[#18364a]">{project.name}</h4>
                          <p className="text-[13px] font-medium text-[#b90014]">
                            {project.role || "Vai trò chưa rõ"}
                          </p>
                        </div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                          {formatDateRange(project.period)}
                        </p>
                      </div>
                      {project.description ? (
                        renderRichBulletText(project.description)
                      ) : (
                        <p className="mt-3 text-[14px] leading-7 text-[#314956]">
                          Chưa có mô tả chi tiết dự án.
                        </p>
                      )}
                      {project.technologies.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.technologies.map((technology) => (
                            <span
                              key={`${project.id}-${technology}`}
                              className="rounded-full border border-[#dce9f2] bg-white px-3 py-1 text-[12px] font-medium text-[#47657a]"
                            >
                              {technology}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[#6c8191]">
                    Chưa có dự án nào được nhận diện từ CV.
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  Học vấn &amp; chứng chỉ
                </p>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                  {parsedResumePreview.educations.length ? (
                    parsedResumePreview.educations.map((education) => (
                      <article
                        key={education.id}
                        className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4"
                      >
                        <p className="text-[16px] font-semibold text-[#18364a]">{education.school}</p>
                        <p className="mt-1 text-[14px] font-medium text-[#b90014]">
                          {education.degree}
                          {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                        </p>
                        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                          {formatMonthYear(null, education.startYear)} -{" "}
                          {education.endYear ? formatMonthYear(null, education.endYear) : "Hiện tại"}
                        </p>
                        {renderRichBulletText(education.description)}
                      </article>
                    ))
                  ) : (
                    <p className="text-[14px] leading-6 text-[#6c8191]">
                      Chưa trích xuất được phần học vấn.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {parsedResumePreview.certifications.length ? (
                    parsedResumePreview.certifications.map((certification) => (
                      <article
                        key={certification.id}
                        className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4"
                      >
                        <p className="text-[16px] font-semibold text-[#18364a]">{certification.name}</p>
                        <p className="mt-1 text-[14px] font-medium text-[#b90014]">
                          {certification.issuer || "Đơn vị cấp chưa rõ"}
                        </p>
                        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                          Cấp ngày {formatSimpleDate(certification.issuedOn)}
                          {certification.expiresOn
                            ? ` • Hết hạn ${formatSimpleDate(certification.expiresOn)}`
                            : ""}
                        </p>
                        {certification.credentialId ? (
                          <p className="mt-3 text-[13px] text-[#47657a]">
                            Credential ID: {certification.credentialId}
                          </p>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className="text-[14px] leading-6 text-[#6c8191]">
                      Chưa thấy chứng chỉ nào trong bản parse này.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                Kỹ năng chính
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {parsedResumePreview.skills.length ? (
                  parsedResumePreview.skills.map((skill, index) => (
                    <span
                      key={skill.id}
                      className={getSkillChipClass(skill.label, index)}
                    >
                      {skill.label}
                      {skill.yearsOfExperience != null ? ` • ${skill.yearsOfExperience} năm` : ""}
                    </span>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[#6c8191]">
                    Chưa có kỹ năng nào được nhận diện.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                Ngoại ngữ
              </p>
              <div className="mt-4 space-y-3">
                {parsedResumePreview.languages.length ? (
                  parsedResumePreview.languages.map((language) => (
                    <div
                      key={language.id}
                      className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3"
                    >
                      <p className="text-[14px] font-semibold text-[#18364a]">{language.name}</p>
                      <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.06em] text-[#47657a]">
                        {language.proficiency}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[#6c8191]">
                    Chưa trích xuất được mục ngoại ngữ.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                Liên kết &amp; nguồn trích xuất
              </p>
              <div className="mt-4 space-y-3 text-[13px] leading-6 text-[#314956]">
                <div className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3">
                  <p className="font-semibold text-[#18364a]">GitHub</p>
                  <p>{parsedResumePreview.profile.github || "Chưa nhận diện"}</p>
                </div>
                <div className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3">
                  <p className="font-semibold text-[#18364a]">LinkedIn</p>
                  <p>{parsedResumePreview.profile.linkedin || "Chưa nhận diện"}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ParsedResumePreviewSection;
