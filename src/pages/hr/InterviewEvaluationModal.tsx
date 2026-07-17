import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { getApiStatusCode } from "../../common/utils/apiError";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { recommendationChipClass } from "../../common/utils/interviewPresentation";
import { useI18n } from "../../i18n";
import {
  hrService,
  type HrInterviewEvaluationPayload,
} from "../../services/hr/hrService";

export type EvaluationTargetInterview = {
  id: string;
  candidateName: string;
  jobTitle: string;
};

export type EvaluationSavedSummary = {
  interviewId: string;
  overallScore: number;
  recommendation: string;
};

type InterviewEvaluationModalProps = {
  open: boolean;
  interview: EvaluationTargetInterview | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (summary: EvaluationSavedSummary) => void;
};

const CRITERIA_KEYS = [
  "technicalScore",
  "communicationScore",
  "problemSolvingScore",
  "cultureFitScore",
] as const;

type CriterionKey = (typeof CRITERIA_KEYS)[number];

const CRITERION_LABEL_KEY: Record<CriterionKey, string> = {
  technicalScore: "interviewEvaluation.criteria.technical",
  communicationScore: "interviewEvaluation.criteria.communication",
  problemSolvingScore: "interviewEvaluation.criteria.problemSolving",
  cultureFitScore: "interviewEvaluation.criteria.cultureFit",
};

const RECOMMENDATIONS = ["StrongHire", "Hire", "NoHire", "StrongNoHire"] as const;

const RECOMMENDATION_LABEL_KEY: Record<string, string> = {
  StrongHire: "interviewEvaluation.recommendations.strongHire",
  Hire: "interviewEvaluation.recommendations.hire",
  NoHire: "interviewEvaluation.recommendations.noHire",
  StrongNoHire: "interviewEvaluation.recommendations.strongNoHire",
};

type ScoresState = Record<CriterionKey, number>;

const EMPTY_SCORES: ScoresState = {
  technicalScore: 0,
  communicationScore: 0,
  problemSolvingScore: 0,
  cultureFitScore: 0,
};

function computeOverall(scores: ScoresState): number | null {
  const values = CRITERIA_KEYS.map((key) => scores[key]);
  if (values.some((value) => value < 1 || value > 5)) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / 20) * 100);
}

// Inner form remounted per interview (key) so opening the modal always starts from a clean
// scorecard without synchronous setState-in-effect resets; the effect only fetches.
function EvaluationScorecard({
  interview,
  canEdit,
  onClose,
  onSaved,
}: {
  interview: EvaluationTargetInterview;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (summary: EvaluationSavedSummary) => void;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState<ScoresState>(EMPTY_SCORES);
  const [recommendation, setRecommendation] = useState<string>("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [notes, setNotes] = useState("");
  const [evaluatorName, setEvaluatorName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    hrService
      .getInterviewEvaluation(interview.id)
      .then((response) => {
        if (!mounted || !response.data) return;
        const data = response.data;
        setScores({
          technicalScore: data.technicalScore,
          communicationScore: data.communicationScore,
          problemSolvingScore: data.problemSolvingScore,
          cultureFitScore: data.cultureFitScore,
        });
        setRecommendation(data.recommendation);
        setStrengths(data.strengths ?? "");
        setConcerns(data.concerns ?? "");
        setNotes(data.notes ?? "");
        setEvaluatorName(data.evaluatorName ?? null);
      })
      .catch((error) => {
        if (!mounted) return;
        // 404 simply means "not evaluated yet" — keep the blank scorecard silently.
        if (getApiStatusCode(error) !== 404) {
          handleNonFormApiError(error);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [interview.id]);

  const overall = computeOverall(scores);
  const saveDisabledReason =
    overall === null
      ? t("interviewEvaluation.scoreAllCriteria")
      : !recommendation
        ? t("interviewEvaluation.selectRecommendation")
        : null;

  async function save() {
    if (overall === null || !recommendation) return;

    const payload: HrInterviewEvaluationPayload = {
      technicalScore: scores.technicalScore,
      communicationScore: scores.communicationScore,
      problemSolvingScore: scores.problemSolvingScore,
      cultureFitScore: scores.cultureFitScore,
      recommendation,
      strengths: strengths.trim() || null,
      concerns: concerns.trim() || null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      const response = await hrService.saveInterviewEvaluation(interview.id, payload);
      appToast.success(t("interviewEvaluation.saveSuccess"));
      onSaved({
        interviewId: interview.id,
        overallScore: response.data?.overallScore ?? overall,
        recommendation: response.data?.recommendation ?? recommendation,
      });
      onClose();
    } catch (error) {
      handleNonFormApiError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-scale-in flex max-h-full w-full max-w-[620px] flex-col overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#eee9e7] px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
            <span className="material-symbols-outlined text-[22px]">rate_review</span>
          </span>
          <div>
            <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1a1c1c]">
              {t("interviewEvaluation.title")}
            </h3>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">
              {interview.candidateName} · {interview.jobTitle}
            </p>
            {evaluatorName ? (
              <p className="mt-0.5 text-[12px] text-[#8a8786]">
                {t("interviewEvaluation.evaluatedBy", { name: evaluatorName })}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f2efed]"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <LoadingIndicator label={t("common.loading")} />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3.5">
              {CRITERIA_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-[14px] font-semibold text-[#1a1c1c]">
                    {t(CRITERION_LABEL_KEY[key])}
                  </p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = scores[key] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!canEdit}
                          className={`h-9 w-9 rounded-[10px] text-[13px] font-bold transition-all active:scale-95 ${
                            selected
                              ? "border border-[#b90014] bg-[#fff1f0] text-[#b90014] shadow-sm"
                              : "border border-[#ececec] text-[#5f5e5e] hover:border-[#b90014] hover:text-[#b90014] disabled:hover:border-[#ececec] disabled:hover:text-[#5f5e5e]"
                          }`}
                          onClick={() =>
                            setScores((prev) => ({ ...prev, [key]: value }))
                          }
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-[14px] border border-[#ffdad6] bg-[#fff8f7] px-4 py-3">
              <p className="text-[13px] font-semibold text-[#5f5e5e]">
                {t("interviewEvaluation.overall")}
              </p>
              <p className="text-[24px] font-bold leading-none text-[#b90014]">
                {overall === null ? "--" : `${overall}/100`}
              </p>
            </div>

            <div>
              <p className="field-label mb-2">{t("interviewEvaluation.recommendation")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RECOMMENDATIONS.map((value) => {
                  const selected = recommendation === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!canEdit}
                      className={`rounded-[10px] px-2 py-2.5 text-[12px] font-bold transition-all active:scale-[0.98] ${
                        selected
                          ? `${recommendationChipClass(value)} ring-1 ring-inset ring-current`
                          : "border border-[#ececec] text-[#5f5e5e] hover:border-[#1a1c1c] hover:text-[#1a1c1c] disabled:hover:border-[#ececec] disabled:hover:text-[#5f5e5e]"
                      }`}
                      onClick={() => setRecommendation(value)}
                    >
                      {t(RECOMMENDATION_LABEL_KEY[value])}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">{t("interviewEvaluation.strengths")}</label>
                <textarea
                  className="input-field min-h-[88px] py-2.5"
                  value={strengths}
                  disabled={!canEdit}
                  placeholder={t("interviewEvaluation.strengthsPlaceholder")}
                  onChange={(event) => setStrengths(event.target.value)}
                />
              </div>
              <div>
                <label className="field-label">{t("interviewEvaluation.concerns")}</label>
                <textarea
                  className="input-field min-h-[88px] py-2.5"
                  value={concerns}
                  disabled={!canEdit}
                  placeholder={t("interviewEvaluation.concernsPlaceholder")}
                  onChange={(event) => setConcerns(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-label">{t("interviewEvaluation.notes")}</label>
              <textarea
                className="input-field min-h-[64px] py-2.5"
                value={notes}
                disabled={!canEdit}
                placeholder={t("interviewEvaluation.notesPlaceholder")}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee9e7] px-6 py-4">
        {canEdit ? (
          <>
            <p className="text-[12px] text-[#8a8786]">{saveDisabledReason ?? ""}</p>
            <AsyncActionButton
              type="button"
              className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={save}
              disabled={loading || saving || saveDisabledReason !== null}
              loading={saving}
              loadingText={t("interviewEvaluation.saving")}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {t("interviewEvaluation.save")}
            </AsyncActionButton>
          </>
        ) : (
          <p className="text-[12px] text-[#8a8786]">{t("interviewEvaluation.viewOnly")}</p>
        )}
      </div>
    </div>
  );
}

function InterviewEvaluationModal({
  open,
  interview,
  canEdit,
  onClose,
  onSaved,
}: InterviewEvaluationModalProps) {
  if (!open || !interview) return null;

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1c1c]/45 px-4 py-6 backdrop-blur-sm">
      <EvaluationScorecard
        key={interview.id}
        interview={interview}
        canEdit={canEdit}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>,
    document.body,
  );
}

export default InterviewEvaluationModal;
