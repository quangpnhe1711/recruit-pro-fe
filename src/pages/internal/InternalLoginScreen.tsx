import { useMemo, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { setCredentials } from "../../store/slices/authSlice";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import Seo from "../../common/components/Seo";
import { useI18n } from "../../i18n";
import {
  getPrimaryRole,
  getRoleHomePath,
} from "../../permissions/rolePermissions";
import ForgotPasswordDialog from "../../common/components/auth/ForgotPasswordDialog";
import LanguageSwitcher from "../../common/components/layout/LanguageSwitcher";
import BrandLogo from "../../common/components/layout/BrandLogo";

type InternalLoginForm = {
  username: string;
  password: string;
};

function InternalLoginScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const schema = yup.object({
    username: yup.string().required(t("auth.usernameRequired")),
    password: yup.string().required(t("auth.passwordRequired")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InternalLoginForm>({
    resolver: yupResolver(schema) as Resolver<InternalLoginForm>,
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const usernamePlaceholder = useMemo(() => t("auth.usernamePlaceholder"), [t]);

  async function onSubmit(data: InternalLoginForm) {
    setLoginError(null);
    try {
      const res = await authService.internalLogin({
        username: data.username,
        password: data.password,
      });

      if (!res.data) {
        throw new Error("Thiếu dữ liệu đăng nhập");
      }

      dispatch(setCredentials(res.data));
      appToast.success(t("auth.loginSuccess"));

      const primaryRole = getPrimaryRole(res.data.user.roles ?? []);
      navigate(getRoleHomePath(primaryRole) ?? "/hr/dashboard", {
        replace: true,
      });
    } catch (err) {
      // Auth failure → inline form banner (no toast). Transport/server errors → toast.
      const handled = applyApiFormError(err, {
        setFieldError: () => {},
        setFormError: setLoginError,
      });
      if (!handled) handleNonFormApiError(err);
    }
  }

  async function handleForgotPassword(identifier: string) {
    await authService.internalForgotPassword({ identifier });
    appToast.success(t("auth.forgotPasswordSent"));
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#161313] text-[#1a1c1c]">
      <Seo title={t("auth.internalLoginTitle")} noindex />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#171313_0%,#211719_46%,#f4efeb_46%,#f7f4f1_100%)] max-lg:bg-[linear-gradient(180deg,#171313_0%,#24191b_38%,#f7f4f1_38%,#f7f4f1_100%)]" />
        <div className="absolute left-[-12%] top-[-18%] h-[420px] w-[420px] rounded-full bg-[#b90014]/25 blur-[120px]" />
        <div className="absolute right-0 top-0 h-full w-[54%] opacity-[0.34] [background-image:linear-gradient(#d8cfca_1px,transparent_1px),linear-gradient(90deg,#d8cfca_1px,transparent_1px)] [background-size:42px_42px] max-lg:w-full" />
        <div className="absolute bottom-10 left-12 h-32 w-32 rounded-[28px] border border-white/10 bg-white/[0.03] max-lg:hidden" />
      </div>

      <div className="relative z-10 flex justify-end px-5 pt-5 md:px-8">
        <LanguageSwitcher dark />
      </div>

      <main className="relative z-10 grid flex-1 items-center gap-8 px-5 pb-8 pt-5 md:px-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(430px,0.62fr)] lg:pb-10">
        <section className="animate-fade-in-up hidden max-w-2xl text-white lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-[#ffdad6]">
            <img alt="RecruitPro logo" className="h-4 w-4 rounded-[4px] object-cover" src="/logo.jpg" />
            {t("auth.internalPortalTag")}
          </div>
          <div className="mt-7">
            <BrandLogo
              compact
              showText
              subtitle={t("auth.internalPortalTag")}
              subtitleClassName="text-[#d7cfcc]"
              titleClassName="text-white"
            />
          </div>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[#d7cfcc]">
            {t("auth.internalLoginSubtitle")}
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-[16px] border border-white/[0.08] bg-white/[0.045] px-4 py-4"
              >
                <div className="h-2 w-10 rounded-full bg-white/12" />
                <div className="mt-8 h-1 rounded-full bg-[#b90014]" />
              </div>
            ))}
          </div>
        </section>

        <div className="animate-fade-in-up mx-auto flex w-full max-w-[480px] flex-col lg:mr-0">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <img alt="RecruitPro logo" className="h-11 w-11 rounded-[14px] object-cover shadow-[0_16px_34px_-18px_rgba(185,0,20,0.8)]" src="/logo.jpg" />
            <div>
              <p className="text-[16px] font-bold tracking-[-0.03em] text-white">
                RecruitPro Internal
              </p>
              <p className="text-[12px] font-semibold text-[#ffdad6]">
                {t("auth.internalPortalTag")}
              </p>
            </div>
          </div>

          <div className="executive-panel w-full p-5 md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-[#1a1c1c]">
                  {t("auth.internalLoginTitle")}
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#5f5e5e]">
                  {t("auth.internalLoginSubtitle")}
                </p>
              </div>
              <img alt="RecruitPro logo" className="hidden h-12 w-12 shrink-0 rounded-[15px] border border-[#eadfdb] object-cover sm:flex" src="/logo.jpg" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {loginError ? (
                <div className="flex items-start gap-3 rounded-[14px] border border-[#f3c5c8] bg-[#fff5f5] px-3.5 py-3 text-[13px] leading-5 text-[#a50d18]">
                  <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
                  <span>{loginError}</span>
                </div>
              ) : null}

              <div>
                <label className="field-label" htmlFor="username">
                  {t("auth.username")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
                    badge
                  </span>
                  <input
                    id="username"
                    {...register("username")}
                    type="text"
                    placeholder={usernamePlaceholder}
                    className="input-field auth-input pl-10"
                    aria-invalid={!!errors.username}
                  />
                </div>
                {errors.username ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                    {errors.username.message}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="field-label" htmlFor="password">
                    {t("auth.password")}
                  </label>
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-[#b90014] transition-colors hover:underline"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
                    lock
                  </span>
                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="input-field auth-input pl-10 pr-12"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8786] transition-colors hover:text-[#1a1c1c]"
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                className="btn btn-primary h-12 w-full text-[14px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("common.processing") : t("auth.login")}
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? "progress_activity" : "arrow_forward"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </main>
      <ForgotPasswordDialog
        title={t("auth.forgotPasswordInternalTitle")}
        label={t("auth.username")}
        placeholder={t("auth.usernamePlaceholder")}
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onSubmit={handleForgotPassword}
      />
    </div>
  );
}

export default InternalLoginScreen;
