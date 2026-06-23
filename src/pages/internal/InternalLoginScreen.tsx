import { useMemo, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { setCredentials } from "../../store/slices/authSlice";
import { toast } from "react-toastify";
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

  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const schema = yup.object({
    username: yup.string().required("Vui lòng nhập username"),
    password: yup.string().required("Vui lòng nhập mật khẩu"),
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

  const usernamePlaceholder = useMemo(() => "your.username", []);

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
      toast.success("Đăng nhập thành công");

      const primaryRole = getPrimaryRole(res.data.user.roles ?? []);
      navigate(getRoleHomePath(primaryRole) ?? "/hr/dashboard", {
        replace: true,
      });
    } catch {
      toast.error("Username hoặc mật khẩu không chính xác");
    }
  }

  async function handleForgotPassword(identifier: string) {
    const response = await authService.internalForgotPassword({ identifier });
    toast.success(
      response.message || "Nếu tài khoản tồn tại, mật khẩu tạm đã được cấp.",
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-[#f9f9f9] [background-image:radial-gradient(#e31b23_0.5px,transparent_0.5px)] [background-size:24px_24px]" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 md:px-10">
        <div className="flex w-full max-w-[440px] flex-col items-center">
          <div className="mb-10 text-center">
            <div className="mb-2 flex items-center justify-center">
              <h1 className="text-[32px] font-black tracking-[-0.02em] text-[#1a1a1a] md:text-[48px] md:leading-[56px]">
                RecruitPro{" "}
                <span className="text-[#b90014] block">Internal</span>
              </h1>
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-[#5d3f3c]">
              Cổng nội bộ doanh nghiệp
            </p>
          </div>

          <div className="w-full rounded-lg border border-[#926e6b]/20 bg-white p-8 shadow-[0_0_40px_rgba(185,0,20,0.05)] md:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-semibold leading-8 text-[#1a1c1c]">
                  Đăng nhập cổng nội bộ
                </h2>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  className="mb-2 block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]"
                  htmlFor="username"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#5d3f3c]">
                    badge
                  </span>
                  <input
                    id="username"
                    {...register("username")}
                    type="text"
                    placeholder={usernamePlaceholder}
                    className="w-full rounded-none border border-[#926e6b]/30 bg-[#f9f9f9] py-3 pl-10 pr-4 text-[14px] leading-[20px] outline-none transition-colors focus:border-[#1a1a1a]"
                  />
                  {errors.username ? (
                    <p className="text-[12px] text-[#ba1a1a]">
                      {errors.username.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between">
                  <label
                    className="block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]"
                    htmlFor="password"
                  >
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] transition-all hover:underline"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#5d3f3c]">
                    lock
                  </span>
                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="w-full rounded-none border border-[#926e6b]/30 bg-[#f9f9f9] py-3 pl-10 pr-12 text-[14px] leading-[20px] outline-none transition-colors focus:border-[#1a1a1a]"
                  />
                  {errors.password ? (
                    <p className="text-[12px] text-[#ba1a1a]">
                      {errors.password.message}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d3f3c] transition-colors hover:text-[#1a1a1a]"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
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
                  Ghi nhớ tài khoản này
                </label>
              </div>
              <button
                type="submit"
                className="flex w-full mt-5 items-center justify-center gap-2 bg-[#b90014] py-4 text-[16px] font-semibold text-white transition-colors active:scale-[0.98] hover:bg-[#e31b23]"
              >
                <span>Đăng nhập</span>
                <span className="material-symbols-outlined text-xl">login</span>
              </button>
            </form>
          </div>
        </div>
      </main>
      <ForgotPasswordDialog
        title="Khôi phục mật khẩu nội bộ"
        label="Username"
        placeholder="your.username"
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onSubmit={handleForgotPassword}
      />
    </div>
  );
}

export default InternalLoginScreen;
