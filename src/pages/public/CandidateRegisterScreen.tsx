import { useState } from "react";
import { Link } from "react-router-dom";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import Seo from "../../common/components/Seo";
import {
  candidateRegisterSchema,
  validateWithSchema,
} from "../../common/validation/formValidation";
import { useI18n } from "../../i18n";
import { candidateService } from "../../services/candidate/candidateService";
import BrandLogo from "../../common/components/layout/BrandLogo";

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
  const { t } = useI18n();
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

      setValues(initialValues);
      setErrors({});
      setSubmitState("success");
      appToast.success(t("authPages.registerSuccessToast"));
    } catch (error) {
      // Server validation (email/username already exists) → inline field errors, not a toast.
      // Transport/server errors → toast.
      const handled = applyApiFormError(error, {
        setFieldError: (field, message) =>
          setErrors((prev) => ({ ...prev, [field]: message })),
        // Backend may key field errors as UserInfo.Email / userInfo.email / email — all normalize to
        // these; anything unmappable falls through to a toast instead of a dead key.
        knownFields: ["username", "fullName", "email", "password", "phone"],
      });
      if (!handled) handleNonFormApiError(error);
      setSubmitState("idle");
    }
  };

  const errorBorder = (name: keyof UserInfoValues) =>
    errors[name] ? "!border-[#b90014]" : "";

  return (
    <main className="flex min-h-screen w-full bg-white text-[#1a1c1c]">
      <Seo title={t("auth.registerTitle")} noindex />
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#1a1c1c] overflow-hidden flex-col p-[40px] justify-between">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#b90014] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-[#b90014] rounded-full blur-[100px] opacity-40" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <BrandLogo
              compact
              subtitle={t("auth.internalPortalTag")}
              subtitleClassName="text-white/60"
              titleClassName="text-white"
            />
          </div>

          <div className="max-w-md">
            <h1 className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-white mb-6">
              {t("authPages.registerHeroTitle")}
            </h1>
            <p className="text-[16px] leading-6 text-[#c8c6c5]">
              {t("authPages.registerHeroBody")}
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="rounded-lg p-6 max-w-sm mb-8 bg-white/5 backdrop-blur-md border border-white/10">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg bg-[#e2e2e2] overflow-hidden">
                <img
                  alt=""
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlAlZV1e91hDMF4fGRTMRqbIGBrPzXs9i5fRgbCNlH-1RL86zpclPUynmUXMnHHAHPQ8Y4ECs1hB5Omj4jl6I9UkUaPOz8B1ukb0XunGwOfUvdmesc6DFhyRbrmw3-gr9sbaGlRpnlSTyOLqTeLj9FnFgfS-KgKMBUzBeZ40E4FbhQfyY7uq_xfn3f_SH2SotuDxdZN2B9g_50Jw3mV_SIyggRn3P3sUfWCBR080gWime6hIkv91ns0eZmfvAx2F1VivefADfYzA"
                />
              </div>
              <div>
                <p className="text-[12px] tracking-[0.05em] font-semibold text-white">
                  {t("authPages.registerQuoteTitle")}
                </p>
                <p className="text-[14px] leading-5 text-[#c8c6c5]">
                  {t("authPages.registerQuote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full lg:w-1/2 flex flex-col bg-white">
        <header className="flex justify-between items-center h-16 px-4 md:px-[40px] border-b border-[#e2dfde]">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo compact />
          </div>

          <Link
            className="flex items-center gap-1 text-[#5f5e5e] hover:text-[#b90014] transition-colors text-[12px] tracking-[0.05em] font-semibold"
            to="/"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            {t("common.goHome")}
          </Link>

          <div className="hidden md:block">
            <span className="text-[14px] leading-5 text-[#5f5e5e]">
              {t("authPages.registerHeaderNote")}
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-[40px] overflow-y-auto">
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-[32px] leading-10 tracking-[-0.01em] font-semibold text-[#1a1c1c] mb-2">
                {t("auth.registerTitle")}
              </h2>
              <p className="text-[14px] leading-5 text-[#5f5e5e]">
                {t("authPages.registerIntro")}
              </p>
            </div>

            {submitState === "success" ? (
              <div className="card animate-fade-in space-y-5 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1ef] text-[#b90014]">
                  <span className="material-symbols-outlined text-[28px]">
                    check_circle
                  </span>
                </div>
                <div>
                  <h3 className="section-title">{t("authPages.registerSuccessTitle")}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#5f5e5e]">
                    {t("authPages.registerSuccessBody")}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link className="btn btn-primary h-11" to="/login">
                    {t("auth.login")}
                  </Link>
                  <Link className="btn btn-secondary h-11" to="/">
                    {t("common.goHome")}
                  </Link>
                </div>
              </div>
            ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="card animate-fade-in space-y-6 p-5 md:p-6">
                <div className="flex items-center gap-3 border-b border-[#ececec] pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                    <span className="material-symbols-outlined text-[20px]">
                      badge
                    </span>
                  </span>
                  <div>
                    <h3 className="section-title">{t("authPages.accountSectionTitle")}</h3>
                    <p className="text-[12px] text-[#8a8786]">
                      {t("authPages.accountSectionHint")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="username"
                    >
                      {t("auth.username")} <span className="text-[#b90014] font-bold">*</span>
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
                      <p className="mt-1.5 text-[12px] text-[#b90014]">
                        {errors.username}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="fullName"
                    >
                      {t("auth.fullName")} <span className="text-[#b90014] font-bold">*</span>
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
                      <p className="mt-1.5 text-[12px] text-[#b90014]">
                        {errors.fullName}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="email"
                    >
                      {t("auth.email")} <span className="text-[#b90014] font-bold">*</span>
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
                      <p className="mt-1.5 text-[12px] text-[#b90014]">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="password"
                    >
                      {t("auth.password")} <span className="text-[#b90014] font-bold">*</span>
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
                      <p className="mt-1.5 text-[12px] text-[#b90014]">
                        {errors.password}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 group">
                    <label
                      className="field-label group-focus-within:text-[#b90014]"
                      htmlFor="phone"
                    >
                      {t("auth.phone")}
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
                      <p className="mt-1.5 text-[12px] text-[#b90014]">
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
                      {t("common.processing")}
                    </>
                  ) : submitState === "success" ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                      {t("authPages.registerSuccessShort")}
                    </>
                  ) : (
                    <>
                      {t("auth.register")}
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[14px] leading-5 text-[#5f5e5e]">
                  {t("auth.haveAccount")}{" "}
                  <Link
                    className="text-[#1a1c1c] font-semibold underline hover:text-[#b90014] transition-colors"
                    to="/login"
                  >
                    {t("auth.login")}
                  </Link>
                </p>
              </div>
            </form>
            )}

            <footer className="mt-16 pt-8 border-t border-[#e2dfde] mb-8">
              <p className="text-center text-[12px] tracking-[0.05em] text-[#5f5e5e] opacity-60">
                {t("authPages.registerFooter1", { year: new Date().getFullYear() })}
                <br />
                {t("authPages.registerFooter2")}
              </p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CandidateRegisterScreen;
