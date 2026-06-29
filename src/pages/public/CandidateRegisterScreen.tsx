import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  candidateRegisterSchema,
  validateWithSchema,
} from "../../common/validation/formValidation";
import { candidateService } from "../../services/candidate/candidateService";

type UserInfoValues = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
};

type RegisterValues = {
  userInfo: UserInfoValues;
};

type ErrorMap = Record<string, string | undefined>;

const initialValues: RegisterValues = {
  userInfo: {
    username: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
  },
};

const baseInputClass = "input-field h-11";

function CandidateRegisterScreen() {
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitState, setSubmitState] = useState("idle");
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    const schemaErrors = validateWithSchema(candidateRegisterSchema, values);
    const nextErrors: ErrorMap = {
      username: schemaErrors["userInfo.username"],
      fullName: schemaErrors["userInfo.fullName"],
      email: schemaErrors["userInfo.email"],
      password: schemaErrors["userInfo.password"],
      phone: schemaErrors["userInfo.phone"],
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  };

  function validateAndSetField(field: keyof UserInfoValues, nextValue: string) {
    const nextValues: RegisterValues = {
      ...values,
      userInfo: {
        ...values.userInfo,
        [field]: nextValue,
      },
    };

    setValues(nextValues);
    if (submitted) {
      const schemaErrors = validateWithSchema(candidateRegisterSchema, nextValues);
      setErrors({
        username: schemaErrors["userInfo.username"],
        fullName: schemaErrors["userInfo.fullName"],
        email: schemaErrors["userInfo.email"],
        password: schemaErrors["userInfo.password"],
        phone: schemaErrors["userInfo.phone"],
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validateForm()) return;

    setSubmitState("processing");

    try {
      await candidateService.register({
        userInfo: values.userInfo,
      });

      setSubmitState("success");
      toast.success("Tạo tài khoản thành công");
      window.setTimeout(() => setSubmitState("idle"), 2000);
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu lên Backend:", error);
      toast.error("Không thể tạo tài khoản");
      setSubmitState("idle");
    }
  };

  const errorBorder = (name: keyof UserInfoValues) =>
    errors[name] ? "!border-[#ba1a1a]" : "";

  return (
    <main className="flex min-h-screen w-full bg-white text-[#1a1c1c]">
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#1A1A1A] overflow-hidden flex-col p-[40px] justify-between">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#b90014] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-[#b90014] rounded-full blur-[100px] opacity-40" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <span className="material-symbols-outlined text-[#b90014] text-4xl">
              rocket_launch
            </span>
            <span className="text-[20px] leading-7 font-semibold text-white tracking-tighter uppercase">
              RecruitPro <span className="font-normal opacity-60">Internal</span>
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-white mb-6">
              Tạo tài khoản và bắt đầu ứng tuyển nhanh hơn.
            </h1>
            <p className="text-[16px] leading-6 text-[#c8c6c5]">
              Chỉ cần thông tin cơ bản để vào hệ thống. Hồ sơ nghề nghiệp có thể
              bổ sung sau trong trang profile.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="rounded-lg p-6 max-w-sm mb-8 bg-white/5 backdrop-blur-md border border-white/10">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg bg-[#e2e2e2] overflow-hidden">
                <img
                  alt="Testimonial Avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlAlZV1e91hDMF4fGRTMRqbIGBrPzXs9i5fRgbCNlH-1RL86zpclPUynmUXMnHHAHPQ8Y4ECs1hB5Omj4jl6I9UkUaPOz8B1ukb0XunGwOfUvdmesc6DFhyRbrmw3-gr9sbaGlRpnlSTyOLqTeLj9FnFgfS-KgKMBUzBeZ40E4FbhQfyY7uq_xfn3f_SH2SotuDxdZN2B9g_50Jw3mV_SIyggRn3P3sUfWCBR080gWime6hIkv91ns0eZmfvAx2F1VivefADfYzA"
                />
              </div>
              <div>
                <p className="text-[12px] tracking-[0.05em] font-semibold text-white">
                  Đăng ký nhanh, hoàn thiện hồ sơ sau
                </p>
                <p className="text-[14px] leading-5 text-[#c8c6c5]">
                  &quot;Flow gọn hơn giúp tôi vào hệ thống ngay và cập nhật profile
                  khi thật sự cần.&quot;
                </p>
              </div>
            </div>
          </div>

          <p className="text-[12px] tracking-[0.18em] uppercase text-[#c8c6c5] opacity-50">
            Enterprise Talent Solutions v4.2
          </p>
        </div>
      </section>

      <section className="w-full lg:w-1/2 flex flex-col bg-white">
        <header className="flex justify-between items-center h-16 px-4 md:px-[40px] border-b border-[#e2dfde]">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="material-symbols-outlined text-[#b90014]">
              rocket_launch
            </span>
            <span className="text-[20px] leading-7 font-semibold text-[#1a1c1c]">
              RecruitPro
            </span>
          </div>

          <Link
            className="flex items-center gap-1 text-[#5f5e5e] hover:text-[#b90014] transition-colors text-[12px] tracking-[0.05em] font-semibold"
            to="/candidate"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Về trang chủ
          </Link>

          <div className="hidden md:block">
            <span className="text-[14px] leading-5 text-[#5f5e5e]">
              Đăng ký tài khoản ứng viên
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-[40px] overflow-y-auto">
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-[32px] leading-10 tracking-[-0.01em] font-semibold text-[#1a1c1c] mb-2">
                Tạo tài khoản
              </h2>
              <p className="text-[14px] leading-5 text-[#5f5e5e]">
                Nhập thông tin cơ bản để bắt đầu. Bạn có thể cập nhật CV và hồ
                sơ nghề nghiệp sau khi đăng nhập.
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="card animate-fade-in space-y-6 p-5 md:p-6">
                <div className="flex items-center gap-3 border-b border-[#ececec] pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                    <span className="material-symbols-outlined text-[20px]">
                      badge
                    </span>
                  </span>
                  <div>
                    <h3 className="section-title">Thông tin tài khoản</h3>
                    <p className="text-[12px] text-[#8a8786]">
                      Chỉ cần các trường cần thiết để tạo tài khoản.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="username"
                    >
                      Tên đăng nhập <span className="text-[#b90014] font-bold">*</span>
                    </label>
                    <input
                      id="username"
                      name="username"
                      required
                      className={`${baseInputClass} ${errorBorder("username")}`}
                      placeholder="jane.doe"
                      type="text"
                      value={values.userInfo.username}
                      onChange={(event) => validateAndSetField("username", event.target.value)}
                    />
                    {errors.username ? (
                      <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                        {errors.username}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="fullName"
                    >
                      Họ và tên <span className="text-[#b90014] font-bold">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      required
                      className={`${baseInputClass} ${errorBorder("fullName")}`}
                      placeholder="Nguyễn Văn A"
                      type="text"
                      value={values.userInfo.fullName}
                      onChange={(event) => validateAndSetField("fullName", event.target.value)}
                    />
                    {errors.fullName ? (
                      <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                        {errors.fullName}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="email"
                    >
                      Email <span className="text-[#b90014] font-bold">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      required
                      className={`${baseInputClass} ${errorBorder("email")}`}
                      placeholder="email@example.com"
                      type="email"
                      value={values.userInfo.email}
                      onChange={(event) => validateAndSetField("email", event.target.value)}
                    />
                    {errors.email ? (
                      <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="password"
                    >
                      Mật khẩu <span className="text-[#b90014] font-bold">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      required
                      className={`${baseInputClass} ${errorBorder("password")}`}
                      placeholder="••••••••"
                      type="password"
                      value={values.userInfo.password}
                      onChange={(event) => validateAndSetField("password", event.target.value)}
                    />
                    {errors.password ? (
                      <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                        {errors.password}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="phone"
                    >
                      Số điện thoại
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      className={`${baseInputClass} ${errorBorder("phone")}`}
                      placeholder="(+84) 8123 45678"
                      type="tel"
                      value={values.userInfo.phone}
                      onChange={(event) => validateAndSetField("phone", event.target.value)}
                    />
                    {errors.phone ? (
                      <p className="mt-1.5 text-[12px] text-[#ba1a1a]">
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[#ececec] bg-white/90 px-4 pb-4 pt-4 backdrop-blur md:-mx-6 md:px-6">
                <button
                  type="submit"
                  disabled={submitState === "processing"}
                  className="btn btn-primary h-12 w-full text-[14px]"
                >
                  {submitState === "processing" ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                      Đang xử lý...
                    </>
                  ) : submitState === "success" ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                      Thành công!
                    </>
                  ) : (
                    <>
                      Tạo tài khoản
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[14px] leading-5 text-[#5f5e5e]">
                  Đã có tài khoản?{" "}
                  <Link
                    className="text-[#1a1c1c] font-semibold underline hover:text-[#b90014] transition-colors"
                    to="/login"
                  >
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </form>

            <footer className="mt-16 pt-8 border-t border-[#e2dfde] mb-8">
              <p className="text-center text-[12px] tracking-[0.05em] text-[#5f5e5e] opacity-60">
                © 2024 RecruitPro Internal. Dành cho người dùng được cấp quyền.
                <br />
                Lưu ý bảo mật nội bộ: hệ thống có ghi nhận IP khi gửi biểu mẫu.
              </p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CandidateRegisterScreen;
