import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import { setCredentials } from "../../store/slices/authSlice";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import Seo from "../../common/components/Seo";
import { useLoading } from "../../hooks/useLoading";
import { useI18n } from "../../i18n";
import { getPrimaryRole, getRoleHomePath } from "../../permissions/rolePermissions";
import ForgotPasswordDialog from "../../common/components/auth/ForgotPasswordDialog";
import BrandLogo from "../../common/components/layout/BrandLogo";

const SPLIT_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBMTlIcPK4mpgSwA_imi8kHx0-hFixr07ehGkHafkq67EVZ4ERaDX6j1a1FB-AVvkTVD572ew4yr91Kjlz8N0hHCtSfUfinE0_imTLyqoomItbc3iASTMH2qqvDewV2GC6Yoyw6CfRuHX-AUDuzf6pAIo3S8gIFevBJUuaSn37gBemeS4Ui1E_0ek3eW5-SSy2vMY3Cr9EV5EP1nAxzWnwgT9gxzza9Ei5vZyziG8C4cnZuRTzJuUDV-7bGv6r2zh3IsADDdqxKEw";

function CandidateLoginScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const schema = yup
    .object({
      username: yup.string().required(t("auth.usernameRequired")),
      password: yup
        .string()
        .required(t("auth.passwordRequired"))
        .min(6, t("auth.passwordMin")),
    })
    .required();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const form = watch();
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { loading, withLoading } = useLoading();

  const onSubmit = async () => {
    setLoginError("");

    try {
      const res = await withLoading(() =>
        authService.candidateLogin({
          username: form.username,
          password: form.password,
        }),
      );

      if (!res.data) {
        throw new Error("Thiếu dữ liệu đăng nhập");
      }

      dispatch(setCredentials(res.data));

      const primaryRole = getPrimaryRole(res.data.user.roles ?? []);
      const redirectTarget =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

      navigate(redirectTarget ?? getRoleHomePath(primaryRole) ?? "/candidate/dashboard", {
        replace: true,
      });
    } catch (err) {
      // Auth failures (invalid credentials / disabled / wrong portal) render inline on the form, not a
      // toast. Only transport/server errors fall through to a toast.
      const handled = applyApiFormError(err, {
        setFieldError: () => {},
        setFormError: setLoginError,
      });
      if (!handled) handleNonFormApiError(err);
      return;
    }
    appToast.success(t("auth.loginSuccess"));
  };

  async function handleForgotPassword(identifier: string) {
    await authService.candidateForgotPassword({ identifier });
    appToast.success(t("auth.forgotPasswordSent"));
  }

  type LoginForm = yup.InferType<typeof schema>;

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f1] text-[#171b18]">
      <Seo title={t("auth.login")} noindex />
      <main className="flex flex-1 flex-col md:flex-row">
        {/* Left Side: Image + Messaging */}
        <section className="relative hidden overflow-hidden bg-[#171b18] md:flex md:w-[46%]">
          <div
            className="absolute inset-0 z-0 opacity-55 saturate-[0.75]"
            style={{
              backgroundImage: `url('${SPLIT_IMAGE_URL}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(135deg,rgba(23,27,24,0.15),rgba(23,27,24,0.96))]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex w-full flex-col justify-between p-10">
            <div>
              <Link to="/" aria-label="RecruitPro">
                <BrandLogo compact showText={false} />
              </Link>
            </div>

            <div className="max-w-xl">
              <h1 className="mb-6 max-w-[10ch] text-[52px] font-extrabold leading-[1.02] tracking-[-0.05em] text-white">
                {t("auth.candidateHeroTitle")}
              </h1>
              <p className="text-[16px] leading-[24px] text-[#c8c6c5]">
                {t("auth.candidateHeroBody")}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-1 w-24 bg-[#b90014]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#e5e2e1]">
                {t("auth.candidateHeroTag")}
              </span>
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f3f5f1] p-5 [background-image:linear-gradient(rgba(23,27,24,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(23,27,24,0.04)_1px,transparent_1px)] [background-size:36px_36px] md:p-10">
          <div className="animate-fade-in-up executive-panel w-full max-w-[500px] p-6 sm:p-8">
            {/* Mobile Logo */}
            <div className="mb-10 flex items-center justify-center gap-2.5 md:hidden">
              <BrandLogo compact />
            </div>

            <div className="mb-8">
              <h2 className="mb-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em] text-[#171b18] md:text-[34px]">
                {t("auth.loginTitle")}
              </h2>
              <p className="text-[14px] leading-6 text-[#5f5e5e]">
                {t("auth.candidateLoginSubtitle")}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Tên đăng nhập */}
              <div>
                <label className="field-label" htmlFor="username">
                  {t("auth.username")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
                    person
                  </span>
                  <input
                    id="username"
                    {...register("username")}
                    type="text"
                    autoComplete="username"
                    placeholder={t("auth.usernamePlaceholder")}
                    className="input-field h-12 pl-10"
                  />
                </div>
                {errors.username ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                    {errors.username.message}
                  </p>
                ) : null}
              </div>

              {/* Password */}
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
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="input-field h-12 pl-10 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8786] transition-colors hover:text-[#1a1c1c]"
                    onClick={() => setShowPassword((v) => !v)}
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

              {loginError && (
                <div className="flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-3">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                  <p className="text-[13px] font-medium text-rose-700">{loginError}</p>
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary h-12 w-full text-[14px]"
              >
                {loading ? (
                  <LoadingIndicator label={t("auth.signingIn")} size="sm" tone="light" />
                ) : (
                  <>
                    {t("auth.login")}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Create account */}
              <div className="border-t border-[#ececec] pt-5 text-center">
                <p className="text-[14px] text-[#5f5e5e]">
                  {t("auth.noAccount")}
                  <Link to="/register" className="ml-1 font-semibold text-[#b90014] hover:underline">
                    {t("auth.register")}
                  </Link>
                </p>
              </div>
            </form>

            <div className="mt-5 flex justify-center">
              <Link
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8a8786] transition-colors hover:text-[#1a1c1c]"
                to="/"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                {t("common.goHome")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ForgotPasswordDialog
        title={t("auth.forgotPasswordCandidateTitle")}
        label={t("auth.username")}
        placeholder={t("auth.usernamePlaceholder")}
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onSubmit={handleForgotPassword}
      />
    </div>
  );
}

export default CandidateLoginScreen;
