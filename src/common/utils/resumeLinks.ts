export function buildResumePreviewPath(resumeId: string, fallbackUrl?: string | null) {
  if (resumeId) {
    return `/api/resumes/${resumeId}/preview`;
  }

  return fallbackUrl ?? "";
}

export function buildResumeDownloadPath(resumeId: string, fallbackUrl?: string | null) {
  if (resumeId) {
    return `/api/resumes/${resumeId}/download`;
  }

  return fallbackUrl ?? "";
}

export function buildPdfViewerUrl(url: string) {
  const separator = url.includes("#") ? "&" : "#";
  return `${url}${separator}toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
}
