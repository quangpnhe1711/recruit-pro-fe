import { useEffect, useState } from "react";
import {
  validateWithSchema,
  type ValidationErrors,
} from "../../validation/formValidation";
import * as yup from "yup";

type ForgotPasswordDialogProps = {
  title: string;
  label: string;
  placeholder: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (identifier: string) => Promise<void>;
};

function ForgotPasswordDialog({
  title,
  label,
  placeholder,
  open,
  onClose,
  onSubmit,
}: ForgotPasswordDialogProps) {
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const schema = yup.object({
    identifier: yup.string().trim().required("Vui lòng nhập thông tin tài khoản."),
  });

  useEffect(() => {
    if (!open) {
      setIdentifier("");
      setSubmitting(false);
      setSubmitted(false);
      setErrors({});
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    setSubmitted(true);
    const trimmed = identifier.trim();
    const nextErrors = validateWithSchema(schema, { identifier: trimmed });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1c1c]/45 p-4 backdrop-blur-[2px]">
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_32px_80px_-16px_rgba(26,28,28,0.3)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
              <span className="material-symbols-outlined">lock_reset</span>
            </div>
            <div>
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1a1c1c]">{title}</h3>
              <p className="mt-1 text-[13px] leading-5 text-[#5f5e5e]">
                Hệ thống sẽ cấp mật khẩu tạm cho tài khoản khớp với thông tin bạn nhập.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="premium-action -mr-1 -mt-1 flex h-9 w-9 items-center justify-center text-[#8a8786] transition-colors hover:bg-[#f3f0ef] hover:text-[#1a1c1c]"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div>
          <label className="field-label">{label}</label>
          <input
            type="text"
            value={identifier}
            onChange={(event) => {
              const nextValue = event.target.value;
              setIdentifier(nextValue);
              if (submitted) {
                setErrors(validateWithSchema(schema, { identifier: nextValue.trim() }));
              }
            }}
            placeholder={placeholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className={`input-field h-12 ${errors.identifier ? "border-[#ba1a1a]" : ""}`}
          />
          {errors.identifier ? (
            <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{errors.identifier}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Đặt lại mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordDialog;
