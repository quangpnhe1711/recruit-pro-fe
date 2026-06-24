import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Badge from "../../common/components/Badge";
import { Skeleton, SkeletonCard, SkeletonText } from "../../common/components/Skeleton";
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
      <div className="app-container space-y-6 py-8">
        <Skeleton className="h-4 w-32" />
        <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="card p-6">
            <SkeletonText lines={6} />
          </div>
          <div className="card p-6">
            <SkeletonText lines={5} />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1f0] to-[#ffe3e0] text-[#b90014]">
            <span className="material-symbols-outlined text-[32px]">person_off</span>
          </div>
          <h1 className="mt-4 text-[20px] font-semibold text-[#1a1c1c]">Không tìm thấy ứng viên</h1>
          <p className="mt-2 text-sm text-[#5f5e5e]">
            Hồ sơ ứng viên chưa sẵn sàng trong quy trình hiện tại.
          </p>
          <button
            type="button"
            className="btn btn-dark mt-6"
            onClick={() => navigate(backPath)}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const initials = detail.profile.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileStats = [
    { label: "Hồ sơ ứng tuyển", value: stats.applications, icon: "description", iconWrap: "from-[#fff1f0] to-[#ffdad6] text-[#b90014]" },
    { label: "Đang xử lý", value: stats.activeApplications, icon: "pending_actions", iconWrap: "from-amber-50 to-amber-100 text-amber-600" },
    { label: "Phỏng vấn", value: stats.interviews, icon: "groups", iconWrap: "from-sky-50 to-sky-100 text-sky-600" },
  ];

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5f5e5e] transition-colors hover:text-[#b90014]"
        onClick={() => navigate(backPath)}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Quay lại danh sách
      </button>

      {/* HERO SUMMARY */}
      <section className="card animate-fade-in-up p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {detail.profile.avatarUrl ? (
              <img
                alt={detail.profile.name}
                className="h-20 w-20 shrink-0 rounded-full border border-[#ececec] object-cover"
                src={detail.profile.avatarUrl}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-2xl font-bold text-[#b90014]">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="eyebrow mb-1.5">Hồ sơ ứng viên</p>
              <h1 className="page-title">{detail.profile.name}</h1>
              <p className="page-subtitle">{detail.profile.headline || "Hồ sơ ứng viên"}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[#8a8786]">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                Tham gia từ {formatDate(detail.profile.memberSince)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {detail.resume ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!currentResumeDownloadPath || !detail.resume) return;
                  void downloadProtectedFile(
                    currentResumeDownloadPath,
                    detail.resume.fileName,
                  ).catch(() => toast.error("Không thể tải CV."));
                }}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Tải CV
              </button>
            ) : null}
            <a className="btn btn-secondary" href={`mailto:${detail.profile.email}`}>
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Liên hệ ứng viên
            </a>
          </div>
        </div>
      </section>

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
        {profileStats.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${card.iconWrap} transition-transform duration-200 group-hover:scale-105`}>
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <div>
                <p className="eyebrow">{card.label}</p>
                <h3 className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Lịch sử ứng tuyển</h2>
            <div className="mt-4 space-y-3">
              {detail.applicationHistory.length ? (
                detail.applicationHistory.map((item) => (
                  <div key={item.applicationId} className="card-interactive p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <Link
                          className="text-[15px] font-semibold text-[#b90014] hover:underline"
                          to={`/jobs/${item.jobId}`}
                        >
                          {item.jobTitle}
                        </Link>
                        <p className="text-[13px] text-[#5f5e5e]">{item.departmentName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#8a8786]">
                        <span>Nộp ngày {formatDate(item.appliedAt)}</span>
                        <span className="text-[#d6d1cf]">•</span>
                        <span>{item.interviewCount} phỏng vấn</span>
                        <Badge tone="neutral">{formatApplicationStatus(item.status)}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-[#f0eceb] pt-3">
                      <Link
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1a1c1c] transition-colors hover:text-[#b90014]"
                        to={`${applicationRoutePrefix}/${item.applicationId}`}
                      >
                        Mở hồ sơ ứng tuyển
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[#8a8786]">Chưa có lịch sử ứng tuyển.</p>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Lịch sử phỏng vấn</h2>
            <div className="mt-4 space-y-3">
              {detail.interviewHistory.length ? (
                detail.interviewHistory.map((item) => (
                  <div key={item.interviewId} className="card-interactive p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1a1c1c]">{item.jobTitle}</p>
                        <p className="text-[13px] text-[#5f5e5e]">{item.departmentName}</p>
                      </div>
                      <div className="text-[13px] text-[#8a8786]">
                        {formatDateTime(item.interviewDate)}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
                      <Badge tone="neutral">{item.status || "Chưa cập nhật"}</Badge>
                      <Link
                        className="font-semibold text-[#b90014] hover:underline"
                        to={`${applicationRoutePrefix}/${item.applicationId}`}
                      >
                        Xem hồ sơ liên quan
                      </Link>
                    </div>
                    {item.notes ? (
                      <p className="mt-3 rounded-[10px] bg-[#faf9f8] p-3 text-[13px] italic leading-6 text-[#5f5e5e]">{item.notes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[#8a8786]">Chưa có lịch sử phỏng vấn.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Tóm tắt hồ sơ</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">Email</dt>
                <dd className="mt-1 break-words text-[14px] font-medium text-[#1a1c1c]">{detail.profile.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">SĐT</dt>
                <dd className="mt-1 text-[14px] font-medium text-[#1a1c1c]">{detail.profile.phone || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">Địa điểm</dt>
                <dd className="mt-1 text-[14px] font-medium text-[#1a1c1c]">{detail.profile.location || "Chưa cập nhật"}</dd>
              </div>
              {detail.profile.bio ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">Giới thiệu</dt>
                  <dd className="mt-1 text-[14px] leading-6 text-[#1a1c1c]">{detail.profile.bio}</dd>
                </div>
              ) : null}
            </dl>
            {detail.profile.linkedin || detail.profile.github ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f0eceb] pt-4">
                {detail.profile.linkedin ? (
                  <a
                    className="btn btn-secondary px-3 py-2 text-[12px]"
                    href={detail.profile.linkedin}
                    rel="noreferrer"
                    target="_blank"
                  >
                    LinkedIn
                  </a>
                ) : null}
                {detail.profile.github ? (
                  <a
                    className="btn btn-secondary px-3 py-2 text-[12px]"
                    href={detail.profile.github}
                    rel="noreferrer"
                    target="_blank"
                  >
                    GitHub
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Kỹ năng</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.skills.length ? (
                detail.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700"
                  >
                    {skill.label}
                    {skill.yearsOfExperience != null ? ` • ${skill.yearsOfExperience} năm` : ""}
                  </span>
                ))
              ) : (
                <span className="text-[13px] text-[#8a8786]">Chưa có kỹ năng trong hồ sơ.</span>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Kinh nghiệm</h2>
            <div className="mt-4 space-y-3">
              {detail.experienceEntries.length ? (
                detail.experienceEntries.map((entry) => (
                  <div key={entry.id} className="rounded-[12px] border border-[#ececec] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{entry.title}</p>
                    <p className="text-[13px] text-[#5f5e5e]">{entry.company}</p>
                    <p className="eyebrow mt-1">{formatExperiencePeriod(entry.period)}</p>
                    {entry.bullets.length ? (
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] leading-6 text-[#5f5e5e]">
                        {entry.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <span className="text-[13px] text-[#8a8786]">Chưa có kinh nghiệm làm việc.</span>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Dự án</h2>
            <div className="mt-4 space-y-3">
              {detail.projects.length ? (
                detail.projects.map((project) => (
                  <div key={project.id} className="rounded-[12px] border border-[#ececec] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{project.name}</p>
                    <p className="text-[13px] text-[#5f5e5e]">{project.role || "Dự án"}</p>
                    <p className="eyebrow mt-1">{formatExperiencePeriod(project.period)}</p>
                    {project.description ? (
                      <p className="mt-3 text-[13px] leading-6 text-[#5f5e5e]">{project.description}</p>
                    ) : null}
                    {project.technologies.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.technologies.map((technology) => (
                          <span
                            key={technology}
                            className="rounded-full bg-[#f2efed] px-3 py-1 text-xs font-semibold text-[#5f5e5e]"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <span className="text-[13px] text-[#8a8786]">Chưa có dự án.</span>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Học vấn</h2>
            <div className="mt-4 space-y-3">
              {detail.educations.length ? (
                detail.educations.map((education) => (
                  <div key={education.id} className="rounded-[12px] border border-[#ececec] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{education.school}</p>
                    <p className="text-[13px] text-[#5f5e5e]">
                      {education.degree}
                      {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                    </p>
                    <p className="eyebrow mt-1">
                      {[education.startYear, education.endYear].filter(Boolean).join(" - ") || "Chưa cập nhật"}
                    </p>
                    {education.description ? (
                      <p className="mt-3 text-[13px] leading-6 text-[#5f5e5e]">{education.description}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <span className="text-[13px] text-[#8a8786]">Chưa có học vấn.</span>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Chứng chỉ & ngôn ngữ</h2>
            <div className="mt-4 space-y-3">
              {detail.certifications.length ? (
                detail.certifications.map((certification) => (
                  <div key={certification.id} className="rounded-[12px] border border-[#ececec] p-4">
                    <p className="font-semibold text-[#1a1c1c]">{certification.name}</p>
                    <p className="text-[13px] text-[#5f5e5e]">{certification.issuer || "Chưa cập nhật đơn vị cấp"}</p>
                  </div>
                ))
              ) : null}
              {detail.languages.length ? (
                <div className="flex flex-wrap gap-2">
                  {detail.languages.map((language) => (
                    <span
                      key={language.id}
                      className="rounded-full bg-[#fff1f0] px-3 py-1 text-xs font-semibold text-[#b90014]"
                    >
                      {language.name} • {language.proficiency}
                    </span>
                  ))}
                </div>
              ) : null}
              {!detail.certifications.length && !detail.languages.length ? (
                <span className="text-[13px] text-[#8a8786]">Chưa có chứng chỉ hoặc ngôn ngữ.</span>
              ) : null}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title border-b border-[#f0eceb] pb-4">Lịch sử CV</h2>
            <div className="mt-4 space-y-2.5">
              {detail.resumeHistory.length ? (
                detail.resumeHistory.map((resume) => (
                  <button
                    key={resume.id}
                    className="card-interactive flex w-full items-center justify-between gap-3 p-4 text-left"
                    type="button"
                    onClick={() => {
                      void openProtectedFileInNewTab(
                        buildResumePreviewPath(resume.id, resume.fileUrl),
                      ).catch(() => toast.error("Không thể mở CV."));
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#1a1c1c]">
                        v{resume.version} • {resume.fileName}
                      </p>
                      <p className="text-[13px] text-[#8a8786]">{formatDateTime(resume.uploadedAt)}</p>
                    </div>
                    {resume.isCurrent ? (
                      <Badge tone="brand">Đang dùng</Badge>
                    ) : (
                      <span className="text-[13px] font-semibold text-[#b90014]">Mở</span>
                    )}
                  </button>
                ))
              ) : (
                <span className="text-[13px] text-[#8a8786]">Chưa có lịch sử CV.</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfileScreen;
