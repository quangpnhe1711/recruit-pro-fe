import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import LoadingIndicator from "../../common/components/LoadingIndicator";
import { formatApplicationStatus } from "../../common/utils/applicationPresentation";
import {
  downloadProtectedFile,
  openProtectedFileInNewTab,
} from "../../common/utils/protectedFile";
import { buildResumeDownloadPath, buildResumePreviewPath } from "../../common/utils/resumeLinks";
import { hrService, type HrCandidateDetailDto } from "../../services/hr/hrService";

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("vi-VN");
}

function formatExperiencePeriod(
  period: HrCandidateDetailDto["experienceEntries"][number]["period"],
) {
  const start = `${String(period.startMonth).padStart(2, "0")}/${period.startYear}`;
  if (period.isCurrent) return `${start} - Hiện tại`;
  if (!period.endMonth || !period.endYear) return start;
  return `${start} - ${String(period.endMonth).padStart(2, "0")}/${period.endYear}`;
}

function CandidateProfileScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { candidateId = "" } = useParams();
  const [detail, setDetail] = useState<HrCandidateDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const isManagerRoute = location.pathname.startsWith("/manager/");
  const backPath = isManagerRoute ? "/manager/applications" : "/hr/candidates";
  const applicationRoutePrefix = isManagerRoute ? "/manager/applications" : "/hr/applications";

  useEffect(() => {
    let mounted = true;

    hrService
      .getCandidateDetail(candidateId)
      .then((response) => {
        if (!mounted) return;
        setDetail(response.data);
      })
      .catch(() => {
        if (!mounted) return;
        setDetail(null);
        toast.error("Không thể tải hồ sơ ứng viên.");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [candidateId]);

  const stats = useMemo(() => {
    return {
      applications: detail?.applicationHistory.length ?? 0,
      interviews: detail?.interviewHistory.length ?? 0,
      activeApplications:
        detail?.applicationHistory.filter((item) =>
          !["REJECTED", "ACCEPTED"].includes(item.status.toUpperCase()),
        ).length ?? 0,
    };
  }, [detail]);
  const currentResumeDownloadPath = detail?.resume
    ? buildResumeDownloadPath(detail.resume.id, detail.resume.fileUrl)
    : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Đang tải hồ sơ ứng viên..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="w-full px-4 py-10 md:px-10">
        <div className="border border-[#e7bdb8] bg-white p-8">
          <h1 className="text-[32px] font-semibold text-[#1a1c1c]">Không tìm thấy ứng viên</h1>
          <p className="mt-2 text-sm text-[#5f5e5e]">
            Hồ sơ ứng viên chưa sẵn sàng trong quy trình hiện tại.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 bg-[#1a1c1c] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => navigate(backPath)}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5f5e5e] hover:text-[#b90014]"
            onClick={() => navigate(backPath)}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại danh sách
          </button>
          <div className="flex items-center gap-4">
            {detail.profile.avatarUrl ? (
              <img
                alt={detail.profile.name}
                className="h-20 w-20 rounded-full border border-[#e7bdb8] object-cover"
                src={detail.profile.avatarUrl}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ffdad6] text-2xl font-bold text-[#b90014]">
                {detail.profile.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-[36px] font-bold text-[#1a1c1c]">{detail.profile.name}</h1>
              <p className="mt-1 text-lg text-[#5f5e5e]">
                {detail.profile.headline || "Hồ sơ ứng viên"}
              </p>
              <p className="mt-2 text-sm text-[#5f5e5e]">
                Tham gia từ {formatDate(detail.profile.memberSince)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {detail.resume ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#b90014] px-5 py-3 text-sm font-semibold text-white hover:bg-[#93000d]"
              onClick={() => {
                if (!currentResumeDownloadPath || !detail.resume) return;
                void downloadProtectedFile(
                  currentResumeDownloadPath,
                  detail.resume.fileName,
                ).catch(() => toast.error("Không thể tải CV."));
              }}
            >
              <span className="material-symbols-outlined text-base">download</span>
              Tải CV
            </button>
          ) : null}
          <a
            className="inline-flex items-center gap-2 border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] hover:bg-[#f3f3f3]"
            href={`mailto:${detail.profile.email}`}
          >
            <span className="material-symbols-outlined text-base">mail</span>
            Liên hệ ứng viên
          </a>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="border border-[#e7bdb8] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
            Hồ sơ ứng tuyển
          </p>
          <p className="mt-3 text-[32px] font-semibold text-[#1a1c1c]">{stats.applications}</p>
        </div>
        <div className="border border-[#e7bdb8] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
            Đang xử lý
          </p>
          <p className="mt-3 text-[32px] font-semibold text-[#1a1c1c]">{stats.activeApplications}</p>
        </div>
        <div className="border border-[#e7bdb8] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
            Phỏng vấn
          </p>
          <p className="mt-3 text-[32px] font-semibold text-[#1a1c1c]">{stats.interviews}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Lịch sử ứng tuyển</h2>
            <div className="mt-4 space-y-4">
              {detail.applicationHistory.length ? (
                detail.applicationHistory.map((item) => (
                  <div key={item.applicationId} className="border border-[#f0d7d3] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <Link
                          className="text-base font-semibold text-[#b90014] hover:underline"
                          to={`/jobs/${item.jobId}`}
                        >
                          {item.jobTitle}
                        </Link>
                        <p className="text-sm text-[#5f5e5e]">{item.departmentName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#5f5e5e]">
                        <span>Nộp ngày {formatDate(item.appliedAt)}</span>
                        <span>{item.interviewCount} phỏng vấn</span>
                        <span className="rounded-full bg-[#f3f3f3] px-3 py-1 font-semibold text-[#1a1c1c]">
                          {formatApplicationStatus(item.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        className="text-sm font-semibold text-[#1a1c1c] hover:text-[#b90014]"
                        to={`${applicationRoutePrefix}/${item.applicationId}`}
                      >
                        Mở hồ sơ ứng tuyển
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5f5e5e]">Chưa có lịch sử ứng tuyển.</p>
              )}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Lịch sử phỏng vấn</h2>
            <div className="mt-4 space-y-4">
              {detail.interviewHistory.length ? (
                detail.interviewHistory.map((item) => (
                  <div key={item.interviewId} className="border border-[#f0d7d3] p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-[#1a1c1c]">{item.jobTitle}</p>
                        <p className="text-sm text-[#5f5e5e]">{item.departmentName}</p>
                      </div>
                      <div className="text-sm text-[#5f5e5e]">
                        {formatDateTime(item.interviewDate)}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-[#f3f3f3] px-3 py-1 font-semibold text-[#1a1c1c]">
                        {item.status || "Chưa cập nhật"}
                      </span>
                      <Link
                        className="font-semibold text-[#b90014] hover:underline"
                        to={`${applicationRoutePrefix}/${item.applicationId}`}
                      >
                        Xem hồ sơ liên quan
                      </Link>
                    </div>
                    {item.notes ? (
                      <p className="mt-3 text-sm italic leading-6 text-[#5d3f3c]">{item.notes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5f5e5e]">Chưa có lịch sử phỏng vấn.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Tóm tắt hồ sơ</h2>
            <div className="mt-4 space-y-3 text-sm text-[#1a1c1c]">
              <p><span className="font-semibold">Email:</span> {detail.profile.email}</p>
              <p><span className="font-semibold">SĐT:</span> {detail.profile.phone || "Chưa cập nhật"}</p>
              <p><span className="font-semibold">Địa điểm:</span> {detail.profile.location || "Chưa cập nhật"}</p>
              {detail.profile.bio ? (
                <p><span className="font-semibold">Giới thiệu:</span> {detail.profile.bio}</p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.profile.linkedin ? (
                <a
                  className="rounded-full border border-[#e7bdb8] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f9f9f9]"
                  href={detail.profile.linkedin}
                  rel="noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
              ) : null}
              {detail.profile.github ? (
                <a
                  className="rounded-full border border-[#e7bdb8] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f9f9f9]"
                  href={detail.profile.github}
                  rel="noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
              ) : null}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Kỹ năng</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.skills.length ? (
                detail.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-[#005f93]/10 px-3 py-1.5 text-xs font-semibold text-[#005f93]"
                  >
                    {skill.label}
                    {skill.yearsOfExperience != null ? ` • ${skill.yearsOfExperience} năm` : ""}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#5f5e5e]">Chưa có kỹ năng trong hồ sơ.</span>
              )}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Kinh nghiệm</h2>
            <div className="mt-4 space-y-4">
              {detail.experienceEntries.length ? (
                detail.experienceEntries.map((entry) => (
                  <div key={entry.id} className="border border-[#f0d7d3] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{entry.title}</p>
                    <p className="text-sm text-[#5f5e5e]">{entry.company}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5e5e]">
                      {formatExperiencePeriod(entry.period)}
                    </p>
                    {entry.bullets.length ? (
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#5d3f3c]">
                        {entry.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <span className="text-sm text-[#5f5e5e]">Chưa có kinh nghiệm làm việc.</span>
              )}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Dự án</h2>
            <div className="mt-4 space-y-4">
              {detail.projects.length ? (
                detail.projects.map((project) => (
                  <div key={project.id} className="border border-[#f0d7d3] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{project.name}</p>
                    <p className="text-sm text-[#5f5e5e]">{project.role || "Dự án"}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5e5e]">
                      {formatExperiencePeriod(project.period)}
                    </p>
                    {project.description ? (
                      <p className="mt-3 text-sm leading-6 text-[#5d3f3c]">{project.description}</p>
                    ) : null}
                    {project.technologies.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.technologies.map((technology) => (
                          <span
                            key={technology}
                            className="rounded-full bg-[#f3f3f3] px-3 py-1 text-xs font-semibold text-[#1a1c1c]"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <span className="text-sm text-[#5f5e5e]">Chưa có dự án.</span>
              )}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Học vấn</h2>
            <div className="mt-4 space-y-4">
              {detail.educations.length ? (
                detail.educations.map((education) => (
                  <div key={education.id} className="border border-[#f0d7d3] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{education.school}</p>
                    <p className="text-sm text-[#5f5e5e]">
                      {education.degree}
                      {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5e5e]">
                      {[education.startYear, education.endYear].filter(Boolean).join(" - ") || "Chưa cập nhật"}
                    </p>
                    {education.description ? (
                      <p className="mt-3 text-sm leading-6 text-[#5d3f3c]">{education.description}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <span className="text-sm text-[#5f5e5e]">Chưa có học vấn.</span>
              )}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Chứng chỉ & ngôn ngữ</h2>
            <div className="mt-4 space-y-4">
              {detail.certifications.length ? (
                detail.certifications.map((certification) => (
                  <div key={certification.id} className="border border-[#f0d7d3] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{certification.name}</p>
                    <p className="text-sm text-[#5f5e5e]">{certification.issuer || "Chưa cập nhật đơn vị cấp"}</p>
                  </div>
                ))
              ) : null}
              {detail.languages.length ? (
                <div className="flex flex-wrap gap-2">
                  {detail.languages.map((language) => (
                    <span
                      key={language.id}
                      className="rounded-full bg-[#ffdad6] px-3 py-1 text-xs font-semibold text-[#b90014]"
                    >
                      {language.name} • {language.proficiency}
                    </span>
                  ))}
                </div>
              ) : null}
              {!detail.certifications.length && !detail.languages.length ? (
                <span className="text-sm text-[#5f5e5e]">Chưa có chứng chỉ hoặc ngôn ngữ.</span>
              ) : null}
            </div>
          </section>

          <section className="border border-[#e7bdb8] bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#1a1c1c]">Lịch sử CV</h2>
            <div className="mt-4 space-y-3">
              {detail.resumeHistory.length ? (
                detail.resumeHistory.map((resume) => (
                  <button
                    key={resume.id}
                    className="flex w-full items-center justify-between border border-[#f0d7d3] p-4 text-left hover:bg-[#fff8f7]"
                    type="button"
                    onClick={() => {
                      void openProtectedFileInNewTab(
                        buildResumePreviewPath(resume.id, resume.fileUrl),
                      ).catch(() => toast.error("Không thể mở CV."));
                    }}
                  >
                    <div>
                      <p className="font-semibold text-[#1a1c1c]">
                        v{resume.version} • {resume.fileName}
                      </p>
                      <p className="text-sm text-[#5f5e5e]">{formatDateTime(resume.uploadedAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#b90014]">
                      {resume.isCurrent ? "Đang dùng" : "Mở"}
                    </span>
                  </button>
                ))
              ) : (
                <span className="text-sm text-[#5f5e5e]">Chưa có lịch sử CV.</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfileScreen;
