import { useMemo, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { setCredentials } from "../../store/slices/authSlice";
import { toast } from "react-toastify";
import Seo from "../../common/components/Seo";
import { useI18n } from "../../i18n";
import {
  getPrimaryRole,
  getRoleHomePath,
} from "../../permissions/rolePermissions";
import ForgotPasswordDialog from "../../common/components/auth/ForgotPasswordDialog";

const rememberedInternalIdentifierKey = "rp_internal_remembered_identifier";

type InternalLoginForm = {
  username: string;
  password: string;
  remember: boolean;
};

function InternalLoginScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const schema = yup.object({
    username: yup.string().required(t("auth.usernameRequired")),
    password: yup.string().required(t("auth.passwordRequired")),
    remember: yup.boolean().default(false),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InternalLoginForm>({
    resolver: yupResolver(schema) as Resolver<InternalLoginForm>,
    defaultValues: {
      username: localStorage.getItem(rememberedInternalIdentifierKey) ?? "",
      password: "",
      remember: Boolean(localStorage.getItem(rememberedInternalIdentifierKey)),
    },
  });

  const usernamePlaceholder = useMemo(() => t("auth.usernamePlaceholder"), [t]);

  async function onSubmit(data: InternalLoginForm) {
    try {
      const res = await authService.internalLogin({
        username: data.username,
        password: data.password,
      });

      if (!res.data) {
        throw new Error("Thiếu dữ liệu đăng nhập");
      }

      dispatch(setCredentials(res.data));
      if (data.remember) {
        localStorage.setItem(
          rememberedInternalIdentifierKey,
          data.username.trim(),
        );
      } else {
        localStorage.removeItem(rememberedInternalIdentifierKey);
      }
      toast.success(t("auth.loginSuccess"));

      const primaryRole = getPrimaryRole(res.data.user.roles ?? []);
      navigate(getRoleHomePath(primaryRole) ?? "/hr/dashboard", {
        replace: true,
      });
    } catch {
      toast.error(t("auth.loginFailed"));
    }
  }

  async function handleForgotPassword(identifier: string) {
    const response = await authService.internalForgotPassword({ identifier });
    toast.success(response.message || t("auth.forgotPasswordSent"));
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <Seo title={t("auth.internalLoginTitle")} noindex />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-[#f9f9f9] [background-image:radial-gradient(#e31b23_0.5px,transparent_0.5px)] [background-size:24px_24px]" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 md:px-10">
        <div className="animate-fade-in-up flex w-full max-w-[440px] flex-col items-center">
          <div className="mb-9 flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white shadow-[0_10px_24px_rgba(185,0,20,0.28)]">
              <span className="material-symbols-outlined">shield_person</span>
            </span>
            <h1 className="text-[30px] font-bold tracking-[-0.02em] text-[#1a1c1c] md:text-[36px]">
              RecruitPro <span className="text-[#b90014]">Internal</span>
            </h1>
            <p className="eyebrow mt-2">{t("auth.internalPortalTag")}</p>
          </div>

          <div className="card w-full p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[#1a1c1c]">
                {t("auth.internalLoginTitle")}
              </h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#5f5e5e]">
                {t("auth.internalLoginSubtitle")}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                    className="input-field h-12 pl-10"
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
                    className="input-field h-12 pl-10 pr-12"
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

              <div className="flex items-center">
                <input
                  id="remember"
                  {...register("remember")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#cbc6c4] text-[#b90014] accent-[#b90014] focus:ring-[#b90014]"
                />
                <label
                  htmlFor="remember"
                  className="ml-2.5 select-none text-[14px] text-[#5f5e5e]"
                >
                  {t("auth.rememberAccount")}
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary h-12 w-full text-[14px]"
              >
                {t("auth.login")}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
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
