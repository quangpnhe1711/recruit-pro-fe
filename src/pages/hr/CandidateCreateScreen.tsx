import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import {
  candidateRegisterSchema,
  validateWithSchema,
} from "../../common/validation/formValidation";
import { useI18n } from "../../i18n";
import { hrService } from "../../services/hr/hrService";

type FormValues = {
  userInfo: {
    username: string;
    fullName: string;
    email: string;
    password: string;
    phone: string;
  };
  profile: {
    currentPosition: string;
    experienceYears: string;
    address: string;
    bio: string;
  };
};

type ErrorMap = Record<string, string | undefined>;

const initialValues: FormValues = {
  userInfo: {
    username: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
  },
  profile: {
    currentPosition: "",
    experienceYears: "",
    address: "",
    bio: "",
  },
};

function CandidateCreateScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validateForm(nextValues = values) {
    const schemaErrors = validateWithSchema(candidateRegisterSchema, nextValues);
    const nextErrors: ErrorMap = {
      username: schemaErrors["userInfo.username"],
      fullName: schemaErrors["userInfo.fullName"],
      email: schemaErrors["userInfo.email"],
      password: schemaErrors["userInfo.password"],
      phone: schemaErrors["userInfo.phone"],
    };

    if (nextValues.profile.experienceYears.trim()) {
      const parsed = Number(nextValues.profile.experienceYears);
      if (!Number.isFinite(parsed) || parsed < 0) {
        nextErrors.experienceYears = "Số năm kinh nghiệm phải lớn hơn hoặc bằng 0.";
      }
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  }

  function updateUserInfo(field: keyof FormValues["userInfo"], nextValue: string) {
    const nextValues: FormValues = {
      ...values,
      userInfo: {
        ...values.userInfo,
        [field]: nextValue,
      },
    };
    setValues(nextValues);
    if (submitted) {
      validateForm(nextValues);
    }
  }

  function updateProfile(field: keyof FormValues["profile"], nextValue: string) {
    const nextValues: FormValues = {
      ...values,
      profile: {
        ...values.profile,
        [field]: nextValue,
      },
    };
    setValues(nextValues);
    if (submitted) {
      validateForm(nextValues);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await hrService.createCandidate({
        userInfo: values.userInfo,
        profile: {
          currentPosition: values.profile.currentPosition.trim() || undefined,
          experienceYears: values.profile.experienceYears.trim()
            ? Number(values.profile.experienceYears)
            : null,
          address: values.profile.address.trim() || undefined,
          bio: values.profile.bio.trim() || undefined,
        },
        resume,
      });

      const candidateId = response.data?.candidateProfileId;
      navigate(candidateId ? `/hr/candidates/${candidateId}` : "/hr/candidates");
    } catch (error) {
      const handled = applyApiFormError(error, {
        setFieldError: (field, message) =>
          setErrors((prev) => ({ ...prev, [field]: message })),
        knownFields: ["username", "fullName", "email", "password", "phone"],
      });
      if (!handled) {
        handleNonFormApiError(error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const errorBorder = (name: string) => (errors[name] ? "!border-[#b90014]" : "");

  return (
    <div className="app-container animate-fade-in py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">HR Candidate Intake</p>
          <h1 className="page-title">Tạo ứng viên mới</h1>
          <p className="page-subtitle">
            Tạo hồ sơ ứng viên thủ công và đưa ngay vào danh sách quản lý.
          </p>
        </div>
        <Link className="btn btn-secondary" to="/hr/candidates">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("common.back")}
        </Link>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="card space-y-5 p-6">
          <div>
            <h2 className="section-title">Thông tin tài khoản</h2>
            <p className="mt-1 text-[13px] text-[#5f5e5e]">
              Đây là bước tạo tài khoản thật cho ứng viên, không còn toast placeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="username">{t("auth.username")}</label>
              <input id="username" className={`input-field ${errorBorder("username")}`} value={values.userInfo.username} onChange={(event) => updateUserInfo("username", event.target.value)} />
              {errors.username ? <p className="text-[12px] text-[#b90014]">{errors.username}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="fullName">{t("auth.fullName")}</label>
              <input id="fullName" className={`input-field ${errorBorder("fullName")}`} value={values.userInfo.fullName} onChange={(event) => updateUserInfo("fullName", event.target.value)} />
              {errors.fullName ? <p className="text-[12px] text-[#b90014]">{errors.fullName}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="email">{t("auth.email")}</label>
              <input id="email" type="email" className={`input-field ${errorBorder("email")}`} value={values.userInfo.email} onChange={(event) => updateUserInfo("email", event.target.value)} />
              {errors.email ? <p className="text-[12px] text-[#b90014]">{errors.email}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="phone">{t("auth.phone")}</label>
              <input id="phone" className={`input-field ${errorBorder("phone")}`} value={values.userInfo.phone} onChange={(event) => updateUserInfo("phone", event.target.value)} />
              {errors.phone ? <p className="text-[12px] text-[#b90014]">{errors.phone}</p> : null}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="field-label" htmlFor="password">{t("auth.password")}</label>
              <input id="password" type="password" className={`input-field ${errorBorder("password")}`} value={values.userInfo.password} onChange={(event) => updateUserInfo("password", event.target.value)} />
              {errors.password ? <p className="text-[12px] text-[#b90014]">{errors.password}</p> : null}
            </div>
          </div>
        </section>

        <section className="card space-y-5 p-6">
          <div>
            <h2 className="section-title">Thông tin hồ sơ</h2>
            <p className="mt-1 text-[13px] text-[#5f5e5e]">
              Có thể bổ sung CV và mô tả ngắn để team review nhanh hơn.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="currentPosition">Vị trí hiện tại</label>
              <input id="currentPosition" className="input-field" value={values.profile.currentPosition} onChange={(event) => updateProfile("currentPosition", event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="experienceYears">Số năm kinh nghiệm</label>
              <input id="experienceYears" type="number" min={0} className={`input-field ${errorBorder("experienceYears")}`} value={values.profile.experienceYears} onChange={(event) => updateProfile("experienceYears", event.target.value)} />
              {errors.experienceYears ? <p className="text-[12px] text-[#b90014]">{errors.experienceYears}</p> : null}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="field-label" htmlFor="address">Địa chỉ</label>
              <input id="address" className="input-field" value={values.profile.address} onChange={(event) => updateProfile("address", event.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="field-label" htmlFor="bio">Giới thiệu ngắn</label>
              <textarea id="bio" className="input-field min-h-28 py-3" value={values.profile.bio} onChange={(event) => updateProfile("bio", event.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="field-label" htmlFor="resume">CV đính kèm</label>
              <input id="resume" type="file" accept=".pdf,.doc,.docx" className="input-field h-auto py-3" onChange={(event) => setResume(event.target.files?.[0] ?? null)} />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn btn-primary h-11 min-w-[180px]">
            {submitting ? t("common.processing") : "Tạo ứng viên"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CandidateCreateScreen;
