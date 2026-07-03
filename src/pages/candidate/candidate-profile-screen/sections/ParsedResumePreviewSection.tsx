import type { CandidateResumeParseResponseDto } from "../../../../services/candidate/candidateService";
import { useI18n } from "../../../../i18n";
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
  const { t } = useI18n();
  return (
    <div className="mt-6 rounded-[28px] border border-[#f1d7db] bg-[linear-gradient(180deg,#fff7f8_0%,#ffffff_100%)] p-4 shadow-[0_24px_60px_rgba(185,0,20,0.10)] md:p-6">
      <div className="rounded-[24px] border border-[#f3e4e7] bg-white p-5 md:p-7">
        <div className="flex flex-col gap-5 border-b border-[#f0e4e6] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f1d7db] bg-[#fff7f8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b90014]">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {parsedResumePreview.usedAi ? t("candidateProfile.parsePreview.aiParsing") : parsedResumePreview.parsingMode}
              </span>
              {parsedResumePreview.modelName ? (
                <span className="rounded-full bg-[#fff0f2] px-3 py-1 text-[11px] font-semibold text-[#7a4b53]">
                  {parsedResumePreview.modelName}
                </span>
              ) : null}
              <span className="rounded-full bg-[#ffe8ec] px-3 py-1 text-[11px] font-semibold text-[#8a1020]">
                {t("candidateProfile.parsePreview.cvDraft")}
              </span>
            </div>

            <h3 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#301419]">
              {parsedResumePreview.profile.name || t("candidateProfile.parsePreview.unknownCandidate")}
            </h3>
            <p className="mt-2 text-[17px] font-medium text-[#b90014]">
              {parsedResumePreview.profile.headline || t("candidateProfile.parsePreview.unknownHeadline")}
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
              {t("candidateProfile.parsePreview.status")}
            </p>
            {!parsedResumePreview.usedAi && parsedResumePreview.aiFallbackReason ? (
              <div className="mt-3 rounded-xl border border-[#ffd7dc] bg-[#fff4f6] px-4 py-3 text-[13px] leading-6 text-[#8a1020]">
                {t("candidateProfile.parsePreview.aiFallback", { reason: parsedResumePreview.aiFallbackReason })}
              </div>
            ) : (
              <p className="mt-3 text-[13px] leading-6 text-[#7a4b53]">
                {t("candidateProfile.parsePreview.readyHint")}
              </p>
            )}

            <div className="mt-4 space-y-2">
              <button
                className="w-full rounded-full bg-[#b90014] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:brightness-110"
                type="button"
                onClick={onApply}
              >
                {t("candidateProfile.parsePreview.apply")}
              </button>
              <button
                className="w-full rounded-full border border-[#e7c8cd] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#8a1020] transition-colors hover:bg-[#fff4f6]"
                type="button"
                onClick={onDismiss}
              >
                {t("candidateProfile.parsePreview.close")}
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
              {getCountLabel(parsedResumePreview.skills.length, t("candidateProfile.parsePreview.detectedItems"))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">{t("candidateProfile.parsePreview.experience")}</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.experienceEntries.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.experienceEntries.length, t("candidateProfile.parsePreview.roles"))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">{t("candidateProfile.collections.projects")}</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.projects.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.projects.length, t("candidateProfile.parsePreview.relatedProjects"))}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">{t("candidateProfile.collections.education")}</p>
            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
              {parsedResumePreview.educations.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5f7280]">
              {getCountLabel(parsedResumePreview.educations.length, t("candidateProfile.parsePreview.educationPrograms"))}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
          <div className="space-y-7">
            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  {t("candidateProfile.parsePreview.professionalSummary")}
                </p>
              </div>
              <p className="mt-4 text-[14px] leading-7 text-[#314956]">
                {parsedResumePreview.profile.bio ||
                  t("candidateProfile.parsePreview.noSummary")}
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  {t("candidateProfile.parsePreview.workExperience")}
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
                    {t("candidateProfile.parsePreview.noExperience")}
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  {t("candidateProfile.parsePreview.featuredProjects")}
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
                            {project.role || t("candidateProfile.parsePreview.unknownRole")}
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
                          {t("candidateProfile.parsePreview.noProjectDescription")}
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
                    {t("candidateProfile.parsePreview.noProjects")}
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                  {t("candidateProfile.parsePreview.educationAndCertifications")}
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
                          {education.endYear ? formatMonthYear(null, education.endYear) : t("candidateProfile.collections.current")}
                        </p>
                        {renderRichBulletText(education.description)}
                      </article>
                    ))
                  ) : (
                    <p className="text-[14px] leading-6 text-[#6c8191]">
                      {t("candidateProfile.parsePreview.noEducation")}
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
                          {certification.issuer || t("candidateProfile.collections.unknownIssuer")}
                        </p>
                        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                          {t("candidateProfile.parsePreview.issuedOn", { date: formatSimpleDate(certification.issuedOn) })}
                          {certification.expiresOn
                            ? ` • ${t("candidateProfile.parsePreview.expiresOn", { date: formatSimpleDate(certification.expiresOn) })}`
                            : ""}
                        </p>
                        {certification.credentialId ? (
                          <p className="mt-3 text-[13px] text-[#47657a]">
                            {t("candidateProfile.parsePreview.credentialId", { id: certification.credentialId })}
                          </p>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className="text-[14px] leading-6 text-[#6c8191]">
                      {t("candidateProfile.parsePreview.noCertifications")}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                {t("candidateProfile.parsePreview.mainSkills")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {parsedResumePreview.skills.length ? (
                  parsedResumePreview.skills.map((skill, index) => (
                    <span
                      key={skill.id}
                      className={getSkillChipClass(skill.label, index)}
                    >
                      {skill.label}
                      {skill.yearsOfExperience != null ? ` • ${t("candidateProfile.parsePreview.years", { count: skill.yearsOfExperience })}` : ""}
                    </span>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[#6c8191]">
                    {t("candidateProfile.parsePreview.noSkills")}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                {t("candidateProfile.collections.languages")}
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
                    {t("candidateProfile.parsePreview.noLanguages")}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                {t("candidateProfile.parsePreview.linksAndSources")}
              </p>
              <div className="mt-4 space-y-3 text-[13px] leading-6 text-[#314956]">
                <div className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3">
                  <p className="font-semibold text-[#18364a]">GitHub</p>
                  <p>{parsedResumePreview.profile.github || t("candidateProfile.parsePreview.notDetected")}</p>
                </div>
                <div className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3">
                  <p className="font-semibold text-[#18364a]">LinkedIn</p>
                  <p>{parsedResumePreview.profile.linkedin || t("candidateProfile.parsePreview.notDetected")}</p>
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
