import { useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import MockJsonButton from "../../common/components/MockJsonButton";

// 1. Định nghĩa lại Type FE khớp hoàn toàn với DTO C#
type UserInfoValues = {
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
    label: "Account",
    title: "Create your account",
    desc: "Enter your basic information to get started.",
    sectionTitle: "Account Credentials",
    sectionIcon: "badge",
  },
  {
    key: "professional",
    label: "Professional",
    title: "Professional Details",
    desc: "Tell us more about your career background.",
    sectionTitle: "Professional Profile",
    sectionIcon: "work",
  },
  {
    key: "links",
    label: "Links",
    title: "Links & Resume",
    desc: "Finalize your candidateProfile with links and documents.",
    sectionTitle: "Links & Resume",
    sectionIcon: "attachment",
  },
];

// 2. Khởi tạo state theo cấu trúc phân tầng mới
const initialValues: RegisterValues = {
  userInfo: {
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

// Định nghĩa các trường bắt buộc theo tầng dữ liệu
const requiredByStep: Record<
  number,
  { group: "userInfo" | "candidateProfile"; fields: string[] }[]
> = {
  1: [{ group: "userInfo", fields: ["fullName", "email", "password"] }],
  2: [],
  3: [],
};

const baseInputClass =
  "w-full h-11 px-4 border border-[#e2dfde] rounded bg-[#f9f9f9] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#b90014] focus:border-2";

const baseTextareaClass =
  "w-full p-4 border border-[#e2dfde] rounded bg-[#f9f9f9] text-[14px] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:border-[#b90014] focus:border-2";

function CandidateRegisterScreen() {
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(1);
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitState, setSubmitState] = useState("idle");

  // Payload giả lập chuẩn chỉnh theo cấu trúc BE nhận được
  const mockPayload = useMemo(() => {
    return {
      screen: "CandidateRegisterScreen",
      payloadToBeSent: {
        userInfo: values.userInfo,
        candidateProfile: values.candidateProfile,
      },
      fileMetadata: values.resume
        ? {
            fileName: values.resume.name,
            mimeType: values.resume.type || "application/octet-stream",
            size: values.resume.size,
          }
        : null,
      notes: [
        "Cấu trúc JSON này map trực tiếp vào CandidateRegisterRequest ở C# Backend.",
        "Trường resume (File) nên được xử lý bằng cách gửi qua FormData nếu upload cùng lúc.",
      ],
    };
  }, [values]);

  const stepConfig = steps[currentStep - 1];
  const stepIndicatorText = useMemo(() => {
    return `Step ${currentStep} of ${totalSteps}: ${stepConfig.label}`;
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
    const rules = requiredByStep[currentStep] || [];
    const nextErrors: ErrorMap = {};

    for (const rule of rules) {
      const groupObj = values[rule.group];
      for (const field of rule.fields) {
        const val = groupObj[field as keyof typeof groupObj];
        if (!String(val ?? "").trim()) {
          nextErrors[field] = "Required";
        }
      }
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
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

    // 1. Khởi tạo đối tượng FormData thay vì JSON body thông thường
    const formData = new FormData();

    // 2. Đóng gói cụm dữ liệu "userInfo" theo quy tắc đặt tên thuộc tính của C#
    formData.append("UserInfo.FullName", values.userInfo.fullName);
    formData.append("UserInfo.Email", values.userInfo.email);
    formData.append("UserInfo.PasswordHash", values.userInfo.password);
    formData.append("UserInfo.Phone", values.userInfo.phone);

    // 3. Đóng gói cụm dữ liệu "candidateProfile"
    formData.append(
      "CandidateProfile.Position",
      values.candidateProfile.position,
    );
    if (values.candidateProfile.experienceYears !== null) {
      formData.append(
        "CandidateProfile.ExperienceYears",
        String(values.candidateProfile.experienceYears),
      );
    }
    formData.append(
      "CandidateProfile.Education",
      values.candidateProfile.education,
    );
    formData.append(
      "CandidateProfile.Address",
      values.candidateProfile.address,
    );
    formData.append("CandidateProfile.Bio", values.candidateProfile.bio);
    formData.append("CandidateProfile.Github", values.candidateProfile.github);
    formData.append(
      "CandidateProfile.Linkedin",
      values.candidateProfile.linkedin,
    );

    // 4. Đóng gói FILE LẺ (Key "resume" phải trùng khớp 100% với tên biến ở tham số Controller C#)
    if (values.resume) {
      formData.append("resume", values.resume);
    }

    // 5. Tiến hành call API thực tế bằng Axios hoặc Fetch
    try {
      // Thay thế URL này bằng endpoint thực tế của Backend C# của bạn
      const response = await fetch(
        "https://localhost:7274/api/candidate/register",
        {
          method: "POST",
          body: formData, // FormData sẽ tự động set Header Content-Type: multipart/form-data kèm theo boundary
        },
      );

      if (response.ok) {
        setSubmitState("success");
        window.setTimeout(() => setSubmitState("idle"), 2000);
      } else {
        console.error("Backend returned an error response");
        setSubmitState("idle");
      }
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu lên Backend:", error);
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
              Forge your career with the industry leaders.
            </h1>
            <p className="text-[16px] leading-6 text-[#c8c6c5]">
              Access exclusive internal opportunities, manage your professional
              growth, and connect with hiring managers across the RecruitPro
              ecosystem.
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
                  Join 500+ Internal Hires
                </p>
                <p className="text-[14px] leading-5 text-[#c8c6c5]">
                  &quot;The streamlined portal changed how I look for internal
                  growth.&quot;
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
            Back to Home
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

              <MockJsonButton
                className="self-start"
                label="Mock API JSON"
                payload={mockPayload}
              />
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Step 1: Account (Gói trong userInfo) */}
              {currentStep === 1 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[#e2dfde] pb-2">
                    <span className="material-symbols-outlined text-[#b90014]">
                      {stepConfig.sectionIcon}
                    </span>
                    <h3 className="text-[20px] leading-7 font-semibold">
                      {stepConfig.sectionTitle}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="fullName"
                      >
                        Full Name{" "}
                        <span className="text-[#b90014] font-bold">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        required
                        className={`${baseInputClass} ${errorBorder("fullName")}`}
                        placeholder="Jane Doe"
                        type="text"
                        value={values.userInfo.fullName}
                        onChange={setField("userInfo", "fullName")}
                      />
                    </div>

                    <div className="space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="email"
                      >
                        Email Address{" "}
                        <span className="text-[#b90014] font-bold">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        required
                        className={`${baseInputClass} ${errorBorder("email")}`}
                        placeholder="jane@recruitpro.com"
                        type="email"
                        value={values.userInfo.email}
                        onChange={setField("userInfo", "email")}
                      />
                    </div>

                    <div className="space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="password"
                      >
                        Password{" "}
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
                    </div>

                    <div className="space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="phone"
                      >
                        Phone Number
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
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[#e2dfde] pb-2">
                    <span className="material-symbols-outlined text-[#b90014]">
                      {stepConfig.sectionIcon}
                    </span>
                    <h3 className="text-[20px] leading-7 font-semibold">
                      {stepConfig.sectionTitle}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="position"
                      >
                        Current Position
                      </label>
                      <input
                        id="position"
                        name="position"
                        className={baseInputClass}
                        placeholder="Senior Talent Specialist"
                        type="text"
                        value={values.candidateProfile.position}
                        onChange={setField("candidateProfile", "position")}
                      />
                    </div>

                    <div className="md:col-span-1 space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="experienceYears"
                      >
                        Years Exp.
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
                      className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                      htmlFor="education"
                    >
                      Education
                    </label>
                    <textarea
                      id="education"
                      name="education"
                      className={baseTextareaClass}
                      placeholder="List your degrees and institutions..."
                      rows={2}
                      value={values.candidateProfile.education}
                      onChange={setField("candidateProfile", "education")}
                    />
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                      htmlFor="address"
                    >
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      className={baseTextareaClass}
                      placeholder="Street, City, State, ZIP..."
                      rows={2}
                      value={values.candidateProfile.address}
                      onChange={setField("candidateProfile", "address")}
                    />
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                      htmlFor="bio"
                    >
                      Professional Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      className={baseTextareaClass}
                      placeholder="Briefly describe your career goals and achievements..."
                      rows={4}
                      value={values.candidateProfile.bio}
                      onChange={setField("candidateProfile", "bio")}
                    />
                  </div>
                </div>
              ) : null}

              {/* Step 3: Links & Resume (Gói trong candidateProfile và file rời) */}
              {currentStep === 3 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[#e2dfde] pb-2">
                    <span className="material-symbols-outlined text-[#b90014]">
                      {stepConfig.sectionIcon}
                    </span>
                    <h3 className="text-[20px] leading-7 font-semibold">
                      {stepConfig.sectionTitle}
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c]">
                      Resume Upload
                    </label>

                    <div className="relative group cursor-pointer border-2 border-dashed border-[#e2dfde] hover:border-[#b90014] rounded-lg p-8 transition-colors bg-[#f3f3f3]/50 flex flex-col items-center justify-center text-center">
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
                        Drag and drop or{" "}
                        <span className="text-[#b90014]">click to upload</span>
                      </p>
                      <p className="text-[10px] uppercase text-[#5f5e5e] tracking-[0.18em] mt-1">
                        PDF, DOCX up to 10MB
                      </p>
                      {values.resume ? (
                        <p className="mt-3 text-[12px] text-[#5f5e5e]">
                          Selected:{" "}
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
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="github"
                      >
                        GitHub URL
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-[18px]">
                          code
                        </span>
                        <input
                          id="github"
                          name="github"
                          className={`pl-10 pr-4 ${baseInputClass}`}
                          placeholder="github.com/username"
                          type="url"
                          value={values.candidateProfile.github}
                          onChange={setField("candidateProfile", "github")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 group">
                      <label
                        className="text-[12px] tracking-[0.05em] font-semibold text-[#1a1c1c] group-focus-within:text-[#b90014]"
                        htmlFor="linkedin"
                      >
                        LinkedIn URL
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-[18px]">
                          link
                        </span>
                        <input
                          id="linkedin"
                          name="linkedin"
                          className={`pl-10 pr-4 ${baseInputClass}`}
                          placeholder="linkedin.com/in/username"
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
              <div className="pt-6 flex flex-col gap-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className={`${currentStep === 1 ? "hidden" : ""} flex-1 h-14 border border-[#e2dfde] text-[#1a1c1c] text-[20px] leading-7 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#f3f3f3] transition-all active:scale-[0.98]`}
                  >
                    <span className="material-symbols-outlined">
                      arrow_back
                    </span>
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className={`${currentStep === totalSteps ? "hidden" : ""} flex-1 h-14 bg-[#b90014] text-white text-[20px] leading-7 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#93000d] transition-all active:scale-[0.98] shadow-lg shadow-[#b90014]/10`}
                  >
                    Next Step
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitState === "processing"}
                    className={`${currentStep === totalSteps ? "" : "hidden"} flex-1 h-14 bg-[#b90014] text-white text-[20px] leading-7 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#93000d] transition-all active:scale-[0.98] shadow-lg shadow-[#b90014]/10 disabled:opacity-70`}
                  >
                    {submitState === "processing" ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          progress_activity
                        </span>
                        Processing...
                      </>
                    ) : submitState === "success" ? (
                      <>
                        <span className="material-symbols-outlined">
                          check_circle
                        </span>
                        Success!
                      </>
                    ) : (
                      <>
                        Create Account
                        <span className="material-symbols-outlined">
                          check_circle
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-[14px] leading-5 text-[#5f5e5e]">
                  Already have an account?{" "}
                  <Link
                    className="text-[#1a1c1c] font-semibold underline hover:text-[#b90014] transition-colors"
                    to="/login"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </form>

            <footer className="mt-16 pt-8 border-t border-[#e2dfde] mb-8">
              <p className="text-center text-[12px] tracking-[0.05em] text-[#5f5e5e] opacity-60">
                © 2024 RecruitPro Internal. For authorized personnel only.
                <br />
                Internal Security Disclosure: IP logged on submission.
              </p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CandidateRegisterScreen;
