import { useMemo, useState, type ChangeEvent } from "react";
import * as yup from "yup";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { candidateService } from "../../services/candidate/candidateService";

// 1. Định nghĩa lại Type FE khớp hoàn toàn với DTO C#
type UserInfoValues = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
};

type CandidateProfileValues = {
  position: string;
  experienceYears: number | null;
  education: string;
  address: string;
  bio: string;
  github: string;
  linkedin: string;
};

type RegisterValues = {
  userInfo: UserInfoValues;
  candidateProfile: CandidateProfileValues;
  resume: File | null; // Giữ riêng xử lý file (thường gửi qua FormData thay vì JSON body)
};

type ErrorMap = Record<string, string | undefined>;

const steps = [
  {
    key: "account",
    label: "Tài khoản",
    title: "Tạo tài khoản",
    desc: "Nhập thông tin cơ bản để bắt đầu.",
    sectionTitle: "Thông tin tài khoản",
    sectionIcon: "badge",
  },
  {
    key: "professional",
    label: "Nghề nghiệp",
    title: "Thông tin nghề nghiệp",
    desc: "Chia sẻ thêm về nền tảng và định hướng của bạn.",
    sectionTitle: "Hồ sơ nghề nghiệp",
    sectionIcon: "work",
  },
  {
    key: "links",
    label: "Liên kết",
    title: "Liên kết & CV",
    desc: "Hoàn thiện hồ sơ với liên kết và tài liệu đính kèm.",
    sectionTitle: "Liên kết & CV",
    sectionIcon: "attachment",
  },
];

// 2. Khởi tạo state theo cấu trúc phân tầng mới
const initialValues: RegisterValues = {
  userInfo: {
    username: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
  },
  candidateProfile: {
    position: "",
    experienceYears: null,
    education: "",
    address: "",
    bio: "",
    github: "",
    linkedin: "",
  },
  resume: null,
};

const baseInputClass = "input-field h-11";

const baseTextareaClass = "input-field resize-none";

function CandidateRegisterScreen() {
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(1);
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitState, setSubmitState] = useState("idle");

  const stepConfig = steps[currentStep - 1];
  const stepIndicatorText = useMemo(() => {
    return `Bước ${currentStep}/${totalSteps}: ${stepConfig.label}`;
  }, [currentStep, totalSteps, stepConfig.label]);

  // 3. Hàm setField cải tiến hỗ trợ cập nhật Object lồng nhau
  const setField =
    (group: "userInfo" | "candidateProfile" | "resume", field?: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (group === "resume") {
        const file = (e.target as HTMLInputElement).files?.[0] ?? null;
        setValues((prev) => ({
          ...prev,
          resume: file,
        }));
        setErrors((prev) => ({ ...prev, resume: undefined }));
        return;
      }

      if (!field) return;

      const targetValue =
        e.target.type === "number"
          ? e.target.value
            ? Number(e.target.value)
            : null
          : e.target.value;

      setValues((prev) => ({
        ...prev,
        [group]: {
          ...prev[group as "userInfo" | "candidateProfile"],
          [field]: targetValue,
        },
      }));

      // Xóa lỗi riêng lẻ của field đó khi user gõ tiếp
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  // 4. Cập nhật hàm Validate theo cấu trúc mới
  const validateCurrentStep = () => {
    const schemas: Record<number, yup.ObjectSchema<yup.AnyObject>> = {
      1: yup.object({
        userInfo: yup.object({
          username: yup
            .string()
            .required("Bắt buộc")
            .min(4, "Tối thiểu 4 ký tự")
            .max(50, "Tối đa 50 ký tự")
            .matches(
              /^[a-zA-Z0-9._-]+$/,
              "Chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang",
            ),
          fullName: yup.string().required("Bắt buộc"),
          email: yup.string().email("Email không hợp lệ").required("Bắt buộc"),
          password: yup
            .string()
            .min(6, "Tối thiểu 6 ký tự")
            .required("Bắt buộc"),
        }),
      }),
      2: yup.object({}),
      3: yup.object({}),
    };

    try {
      const schema = schemas[currentStep] || yup.object({});
      schema.validateSync(values, { abortEarly: false });
      setErrors((prev) => ({ ...prev }));
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const nextErrors: ErrorMap = {};
        err.inner.forEach((e) => {
          if (e.path) nextErrors[e.path] = e.message;
        });
        setErrors((prev) => ({ ...prev, ...nextErrors }));
      }
      return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((s) => Math.min(totalSteps, s + 1));
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setSubmitState("processing");

    try {
      await candidateService.register({
        userInfo: values.userInfo,
        profile: {
          currentPosition: values.candidateProfile.position,
          experienceYears: values.candidateProfile.experienceYears,
          education: values.candidateProfile.education,
          address: values.candidateProfile.address,
          bio: values.candidateProfile.bio,
          githubUrl: values.candidateProfile.github,
          linkedInUrl: values.candidateProfile.linkedin,
        },
        resume: values.resume,
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

  const dotClass = (index: number) => {
    const active = index <= currentStep;
    return [
      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
      active
        ? "border-[#b90014] bg-[#b90014] text-white"
        : "border-[#e2e2e2] text-[#5f5e5e]",
    ].join(" ");
  };

  const labelClass = (index: number) =>
    index <= currentStep ? "text-[#1a1c1c]" : "text-[#5f5e5e]";

  const lineClass = (index: number) =>
    index < currentStep ? "bg-[#b90014]" : "bg-[#e2e2e2]";

  const errorBorder = (name: string) =>
    errors[name] ? "!border-[#ba1a1a]" : "";

  return (
    <main className="flex min-h-screen w-full bg-white text-[#1a1c1c]">
      {/* Left Side */}
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
              RecruitPro{" "}
              <span className="font-normal opacity-60">Internal</span>
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-white mb-6">
              Mở ra hành trình sự nghiệp cùng đội ngũ dẫn đầu.
            </h1>
            <p className="text-[16px] leading-6 text-[#c8c6c5]">
              Tiếp cận các cơ hội phù hợp, phát triển hồ sơ nghề nghiệp và kết
              nối với đội ngũ tuyển dụng trong hệ sinh thái RecruitPro.
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
                  Đồng hành cùng 500+ lượt tuyển dụng nội bộ
                </p>
                <p className="text-[14px] leading-5 text-[#c8c6c5]">
                  &quot;Cổng tuyển dụng này giúp tôi tiếp cận cơ hội phát triển
                  rõ ràng và nhanh hơn.&quot;
                </p>
              </div>
            </div>
          </div>

          <p className="text-[12px] tracking-[0.18em] uppercase text-[#c8c6c5] opacity-50">
            Enterprise Talent Solutions v4.2
          </p>
        </div>
      </section>

      {/* Right Side */}
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
              {stepIndicatorText}
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-[40px] overflow-y-auto">
          <div className="w-full max-w-lg">
            {/* Progress */}
            <div className="mb-10 flex items-center justify-between">
              {steps.map((s, idx) => {
                const index = idx + 1;
                return (
                  <div
                    key={s.key}
                    className="flex items-center flex-1 last:flex-[0.7]"
                  >
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className={dotClass(index)}>{index}</div>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold ${labelClass(index)}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {index < totalSteps ? (
                      <div
                        className={`h-[2px] flex-1 -mt-6 transition-all ${lineClass(index)}`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[32px] leading-10 tracking-[-0.01em] font-semibold text-[#1a1c1c] mb-2">
                  {stepConfig.title}
                </h2>
                <p className="text-[14px] leading-5 text-[#5f5e5e]">
                  {stepConfig.desc}
                </p>
              </div>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Step 1: Account (Gói trong userInfo) */}
              {currentStep === 1 ? (
                <div className="card animate-fade-in space-y-6 p-5 md:p-6">
                  <div className="flex items-center gap-3 border-b border-[#ececec] pb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                      <span className="material-symbols-outlined text-[20px]">
                        {stepConfig.sectionIcon}
                      </span>
                    </span>
                    <div>
                      <h3 className="section-title">{stepConfig.sectionTitle}</h3>
                      <p className="text-[12px] text-[#8a8786]">
                        Thông tin đăng nhập và liên hệ của bạn.
                      </p>
                    </div>
                  </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="username"
                    >
                      Tên đăng nhập{" "}
                      <span className="text-[#b90014] font-bold">*</span>
                    </label>
                    <input
                      id="username"
                      name="username"
                      required
                      className={`${baseInputClass} ${errorBorder("username")}`}
                      placeholder="jane.doe"
                      type="text"
                      value={values.userInfo.username}
                      onChange={setField("userInfo", "username")}
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
                        Họ và tên{" "}
                        <span className="text-[#b90014] font-bold">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        required
                        className={`${baseInputClass} ${errorBorder("fullName")}`}
                        placeholder="Nguyễn Văn A"
                        type="text"
                        value={values.userInfo.fullName}
                        onChange={setField("userInfo", "fullName")}
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
                        Email{" "}
                        <span className="text-[#b90014] font-bold">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        required
                        className={`${baseInputClass} ${errorBorder("email")}`}
                        placeholder="email@example.com"
                        type="email"
                        value={values.userInfo.email}
                        onChange={setField("userInfo", "email")}
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
                        Mật khẩu{" "}
                        <span className="text-[#b90014] font-bold">*</span>
                      </label>
                      <input
                        id="password"
                        name="password"
                        required
                        className={`${baseInputClass} ${errorBorder("password")}`}
                        placeholder="••••••••"
                        type="password"
                        value={values.userInfo.password}
                        onChange={setField("userInfo", "password")}
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
                        className={baseInputClass}
                        placeholder="(+84) 8123 45678"
                        type="tel"
                        value={values.userInfo.phone}
                        onChange={setField("userInfo", "phone")}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Step 2: Professional Details (Gói trong candidateProfile) */}
              {currentStep === 2 ? (
                <div className="card animate-fade-in space-y-6 p-5 md:p-6">
                  <div className="flex items-center gap-3 border-b border-[#ececec] pb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                      <span className="material-symbols-outlined text-[20px]">
                        {stepConfig.sectionIcon}
                      </span>
                    </span>
                    <div>
                      <h3 className="section-title">{stepConfig.sectionTitle}</h3>
                      <p className="text-[12px] text-[#8a8786]">
                        Giúp nhà tuyển dụng hiểu rõ hơn về kinh nghiệm của bạn.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1.5 group">
                      <label
                        className="field-label group-focus-within:text-[#b90014]"
                        htmlFor="position"
                      >
                        Vị trí hiện tại
                      </label>
                      <input
                        id="position"
                        name="position"
                        className={baseInputClass}
                        placeholder="Chuyên viên tuyển dụng cấp cao"
                        type="text"
                        value={values.candidateProfile.position}
                        onChange={setField("candidateProfile", "position")}
                      />
                    </div>

                    <div className="md:col-span-1 space-y-1.5 group">
                      <label
                        className="field-label group-focus-within:text-[#b90014]"
                        htmlFor="experienceYears"
                      >
                        Số năm kinh nghiệm
                      </label>
                      <input
                        id="experienceYears"
                        name="experienceYears"
                        className={baseInputClass}
                        placeholder="5"
                        type="number"
                        value={values.candidateProfile.experienceYears || ""}
                        onChange={setField(
                          "candidateProfile",
                          "experienceYears",
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="education"
                    >
                      Học vấn
                    </label>
                    <textarea
                      id="education"
                      name="education"
                      className={baseTextareaClass}
                      placeholder="Liệt kê bằng cấp và đơn vị đào tạo..."
                      rows={2}
                      value={values.candidateProfile.education}
                      onChange={setField("candidateProfile", "education")}
                    />
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="address"
                    >
                      Địa chỉ
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      className={baseTextareaClass}
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                      rows={2}
                      value={values.candidateProfile.address}
                      onChange={setField("candidateProfile", "address")}
                    />
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="bio"
                    >
                      Giới thiệu bản thân
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      className={baseTextareaClass}
                      placeholder="Mô tả ngắn về mục tiêu nghề nghiệp và thành tựu của bạn..."
                      rows={4}
                      value={values.candidateProfile.bio}
                      onChange={setField("candidateProfile", "bio")}
                    />
                  </div>
                </div>
              ) : null}

              {/* Step 3: Links & Resume (Gói trong candidateProfile và file rời) */}
              {currentStep === 3 ? (
                <div className="card animate-fade-in space-y-6 p-5 md:p-6">
                  <div className="flex items-center gap-3 border-b border-[#ececec] pb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                      <span className="material-symbols-outlined text-[20px]">
                        {stepConfig.sectionIcon}
                      </span>
                    </span>
                    <div>
                      <h3 className="section-title">{stepConfig.sectionTitle}</h3>
                      <p className="text-[12px] text-[#8a8786]">
                        Đính kèm CV và liên kết hồ sơ trực tuyến của bạn.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label">Tải CV</label>

                    <div className="relative group cursor-pointer border-2 border-dashed border-[#dcd7d5] hover:border-[#b90014] rounded-[14px] p-8 transition-colors bg-[#faf9f8] hover:bg-[#fff6f4] flex flex-col items-center justify-center text-center">
                      <input
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="resume"
                        name="resume"
                        type="file"
                        onChange={setField("resume")}
                      />
                      <span className="material-symbols-outlined text-[#5f5e5e] text-4xl mb-2 group-hover:text-[#b90014] transition-colors">
                        cloud_upload
                      </span>
                      <p className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c]">
                        Kéo thả hoặc{" "}
                        <span className="text-[#b90014]">bấm để tải lên</span>
                      </p>
                      <p className="text-[10px] uppercase text-[#5f5e5e] tracking-[0.18em] mt-1">
                        PDF, DOCX tối đa 10MB
                      </p>
                      {values.resume ? (
                        <p className="mt-3 text-[12px] text-[#5f5e5e]">
                          Đã chọn:{" "}
                          <span className="font-semibold">
                            {values.resume.name}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 group">
                      <label
                        className="field-label group-focus-within:text-[#b90014]"
                        htmlFor="github"
                      >
                        Liên kết GitHub
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-[18px]">
                          code
                        </span>
                        <input
                          id="github"
                          name="github"
                          className={`pl-10 pr-4 ${baseInputClass}`}
                          placeholder="github.com/ten-cua-ban"
                          type="url"
                          value={values.candidateProfile.github}
                          onChange={setField("candidateProfile", "github")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 group">
                      <label
                        className="field-label group-focus-within:text-[#b90014]"
                        htmlFor="linkedin"
                      >
                        Liên kết LinkedIn
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-[18px]">
                          link
                        </span>
                        <input
                          id="linkedin"
                          name="linkedin"
                          className={`pl-10 pr-4 ${baseInputClass}`}
                          placeholder="linkedin.com/in/ten-cua-ban"
                          type="url"
                          value={values.candidateProfile.linkedin}
                          onChange={setField("candidateProfile", "linkedin")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[#ececec] bg-white/90 px-4 pb-4 pt-4 backdrop-blur md:-mx-6 md:px-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className={`${currentStep === 1 ? "hidden" : ""} btn btn-secondary h-12 flex-1 text-[14px]`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_back
                    </span>
                    Quay lại
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className={`${currentStep === totalSteps ? "hidden" : ""} btn btn-primary h-12 flex-1 text-[14px]`}
                  >
                    Bước tiếp theo
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitState === "processing"}
                    className={`${currentStep === totalSteps ? "" : "hidden"} btn btn-primary h-12 flex-1 text-[14px]`}
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
                </div>

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
