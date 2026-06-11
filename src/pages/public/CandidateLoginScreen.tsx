import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { toast } from "react-toastify";
import { setCredentials } from "../../store/slices/authSlice";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { useLoading } from "../../common/hooks/useLoading";
import { getPrimaryRole, getRoleHomePath } from "../../permissions/rolePermissions";
import ForgotPasswordDialog from "../../common/components/auth/ForgotPasswordDialog";

const rememberedCandidateEmailKey = "rp_candidate_remembered_email";

const SPLIT_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBMTlIcPK4mpgSwA_imi8kHx0-hFixr07ehGkHafkq67EVZ4ERaDX6j1a1FB-AVvkTVD572ew4yr91Kjlz8N0hHCtSfUfinE0_imTLyqoomItbc3iASTMH2qqvDewV2GC6Yoyw6CfRuHX-AUDuzf6pAIo3S8gIFevBJUuaSn37gBemeS4Ui1E_0ek3eW5-SSy2vMY3Cr9EV5EP1nAxzWnwgT9gxzza9Ei5vZyziG8C4cnZuRTzJuUDV-7bGv6r2zh3IsADDdqxKEw";

function CandidateLoginScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const schema = yup
    .object({
      email: yup.string().email("Invalid email").required("Email is required"),
      password: yup
        .string()
        .required("Password is required")
        .min(6, "Minimum 6 characters"),
      remember: yup.boolean(),
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
      email: localStorage.getItem(rememberedCandidateEmailKey) ?? "",
      password: "",
      remember: Boolean(localStorage.getItem(rememberedCandidateEmailKey)),
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
          email: form.email,
          password: form.password,
        }),
      );

      if (!res.data) {
        throw new Error("Missing login payload");
      }

      dispatch(setCredentials(res.data));

      if (form.remember) {
        localStorage.setItem(rememberedCandidateEmailKey, form.email.trim());
      } else {
        localStorage.removeItem(rememberedCandidateEmailKey);
      }

      const primaryRole = getPrimaryRole(res.data.user.roles ?? []);

      navigate(getRoleHomePath(primaryRole) ?? "/candidate/dashboard", {
        replace: true,
      });
    } catch {
      setLoginError("Email hoặc mật khẩu không chính xác");
      return;
    }
    toast.success("Đăng nhập thành công");
    
  };

  async function handleForgotPassword(identifier: string) {
    const response = await authService.candidateForgotPassword({ identifier });
    toast.success(response.message || "Temporary password has been issued if the account exists.");
  }

  type LoginForm = yup.InferType<typeof schema>;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9] text-[#1a1c1c]">
      <main className="flex flex-1 flex-col md:flex-row">
        {/* Left Side: Image + Messaging */}
        <section className="relative hidden overflow-hidden bg-[#1a1c1c] md:flex md:w-1/2">
          <div
            className="absolute inset-0 z-0 opacity-70"
            style={{
              backgroundImage: `url('${SPLIT_IMAGE_URL}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#1a1c1c] via-transparent to-transparent"
            aria-hidden="true"
          />

          <div className="relative z-10 flex w-full flex-col justify-between p-10">
            <div>
              <Link
                to="/"
                className="text-[48px] font-black leading-[56px] tracking-[-0.02em] text-[#b90014]"
              >
                RecruitPro
              </Link>
            </div>

            <div className="max-w-xl">
              <h1 className="mb-6 text-[48px] font-black leading-[56px] tracking-[-0.02em] text-white">
                Build the future of recruitment
              </h1>
              <p className="text-[16px] leading-[24px] text-[#c8c6c5]">
                Join the enterprise network powering high-velocity global
                hiring. Our platform connects top-tier candidates with
                world-changing opportunities through precision-engineered
                workflows.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-1 w-24 bg-[#b90014]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#e5e2e1]">
                Enterprise Internal Portal
              </span>
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="flex flex-1 items-center justify-center bg-[#f9f9f9] p-4 md:w-1/2 md:p-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-12 flex justify-center md:hidden">
              <span className="text-[48px] font-black leading-[56px] tracking-[-0.02em] text-[#b90014]">
                RecruitPro
              </span>
            </div>

            <div className="mb-10 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-2 text-[32px] font-semibold leading-[40px] tracking-[-0.01em] text-[#1a1c1c]">
                  Welcome Back
                </h2>
                <p className="text-[14px] leading-[20px] text-[#5d3f3c]">
                  Enter your credentials to access your candidate portal.
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div className="space-y-2">
                <label
                  className="block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="h-12 w-full rounded-none border border-[#926e6b] bg-white px-4 outline-none transition-colors placeholder:text-[#926e6b] focus:border-[#1a1c1c]"
                />
                {errors.email ? (
                  <p className="text-[12px] text-[#ba1a1a]">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className="block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] transition-colors hover:underline"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 w-full rounded-none border border-[#926e6b] bg-white px-4 pr-12 outline-none transition-colors placeholder:text-[#926e6b] focus:border-[#1a1c1c]"
                  />
                  {errors.password ? (
                    <p className="text-[12px] text-[#ba1a1a]">
                      {errors.password.message}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5d3f3c] transition-colors hover:text-[#1a1c1c]"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center">
                <input
                  id="remember"
                  {...register("remember")}
                  type="checkbox"
                  className="h-4 w-4 rounded-none border-[#926e6b] text-[#b90014] focus:ring-[#b90014]"
                />
                <label
                  htmlFor="remember"
                  className="ml-3 select-none text-[14px] leading-[20px] text-[#5d3f3c]"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full bg-[#b90014] text-[12px] font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#93000d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingIndicator label="Signing In..." size="sm" tone="light" />
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
              {loginError && (
                <div className="rounded border border-red-300 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}

              {/* Create account */}
              <div className="border-t border-[#e7bdb8] pt-6 text-center">
                <p className="text-[14px] leading-[20px] text-[#5d3f3c]">
                  New to the platform?
                  <Link
                    to="/candidate/register"
                    className="ml-1 font-bold text-[#b90014] hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </form>

            <div className="mt-4 flex justify-center">
              <Link
                className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
                to="/home"
              >
                Back to Home page
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ForgotPasswordDialog
        title="Candidate Password Reset"
        label="Candidate Email"
        placeholder="name@company.com"
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onSubmit={handleForgotPassword}
      />
    </div>
  );
}

export default CandidateLoginScreen;
