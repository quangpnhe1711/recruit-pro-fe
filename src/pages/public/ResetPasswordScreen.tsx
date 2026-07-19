import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import Seo from "../../common/components/Seo";
import { useLoading } from "../../hooks/useLoading";
import { useI18n } from "../../i18n";
import BrandLogo from "../../common/components/layout/BrandLogo";

function ResetPasswordScreen() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const portal = params.get("portal");
  const loginPath = portal === "internal" ? "/internal/login" : "/login";

  const schema = useMemo(
    () =>
      yup
        .object({
          newPassword: yup
            .string()
            .required(t("auth.passwordRequired"))
            .min(6, t("auth.passwordMin")),
          confirmPassword: yup
            .string()
            .required(t("auth.passwordRequired"))
            .oneOf([yup.ref("newPassword")], t("auth.resetPasswordConfirmMismatch")),
        })
        .required(),
    [t],
  );

  type ResetForm = yup.InferType<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: yupResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const { loading, withLoading } = useLoading();

  const onSubmit = async (values: ResetForm) => {
    setFormError("");
    try {
      await withLoading(() =>
        authService.resetPassword({ token, newPassword: values.newPassword }),
      );
    } catch (err) {
      // Business errors (expired/used link, too-short password) render inline; transport errors toast.
      const handled = applyApiFormError(err, {
        setFieldError: () => {},
        setFormError,
      });
      if (!handled) handleNonFormApiError(err);
      return;
    }
    setDone(true);
    appToast.success(t("auth.resetPasswordSuccess"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5f1] p-5 text-[#171b18] [background-image:linear-gradient(rgba(23,27,24,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(23,27,24,0.035)_1px,transparent_1px)] [background-size:36px_36px]">
      <Seo title={t("auth.resetPasswordTitle")} noindex />
      <div className="animate-fade-in-up w-full max-w-md">
        <div className="mb-8 flex items-center justify-center">
          <Link to="/" aria-label="RecruitPro">
            <BrandLogo compact />
          </Link>
        </div>

        <div className="rounded-2xl border border-[#ececec] bg-white p-7 shadow-[0_32px_80px_-16px_rgba(26,28,28,0.12)]">
          {!token ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff1f0] text-[#b90014]">
                <span className="material-symbols-outlined">link_off</span>
              </div>
              <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.01em]">
                {t("auth.resetTokenMissingTitle")}
              </h2>
              <p className="mb-6 text-[14px] leading-6 text-[#5f5e5e]">
                {t("auth.resetTokenMissing")}
              </p>
              <Link to={loginPath} className="btn btn-primary h-12 w-full text-[14px]">
                {t("auth.resetGoToLogin")}
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.01em]">
                {t("auth.resetPasswordSuccessTitle")}
              </h2>
              <p className="mb-6 text-[14px] leading-6 text-[#5f5e5e]">
                {t("auth.resetPasswordSuccess")}
              </p>
              <Link to={loginPath} className="btn btn-primary h-12 w-full text-[14px]">
                {t("auth.resetGoToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="mb-2 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
                  {t("auth.resetPasswordTitle")}
                </h2>
                <p className="text-[14px] leading-6 text-[#5f5e5e]">
                  {t("auth.resetPasswordSubtitle")}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="field-label" htmlFor="newPassword">
                    {t("auth.resetNewPassword")}
                  </label>
                  <input
                    id="newPassword"
                    {...register("newPassword")}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="input-field h-12"
                  />
                  {errors.newPassword ? (
                    <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                      {errors.newPassword.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="confirmPassword">
                    {t("auth.resetConfirmPassword")}
                  </label>
                  <input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="input-field h-12"
                  />
                  {errors.confirmPassword ? (
                    <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                {formError && (
                  <div className="flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-3">
                    <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                    <p className="text-[13px] font-medium text-rose-700">{formError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-12 w-full text-[14px]"
                >
                  {loading ? (
                    <LoadingIndicator
                      label={t("auth.resetPasswordSubmitting")}
                      size="sm"
                      tone="light"
                    />
                  ) : (
                    t("auth.resetPasswordSubmit")
                  )}
                </button>

                <div className="border-t border-[#ececec] pt-4 text-center">
                  <Link
                    to={loginPath}
                    className="text-[13px] font-medium text-[#8a8786] transition-colors hover:text-[#1a1c1c]"
                  >
                    {t("auth.resetGoToLogin")}
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordScreen;
