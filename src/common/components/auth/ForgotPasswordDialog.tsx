import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!open) {
      setIdentifier("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    const trimmed = identifier.trim();
    if (!trimmed) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#e2dfde] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-semibold text-[#1a1c1c]">{title}</h3>
            <p className="mt-1 text-[14px] text-[#5f5e5e]">
              Hệ thống sẽ cấp mật khẩu tạm cho tài khoản khớp thông tin.
            </p>
          </div>
          <button
            type="button"
            className="text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]">
            {label}
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={placeholder}
            className="h-12 w-full rounded-none border border-[#926e6b]/30 bg-[#f9f9f9] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#93000d] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSubmit}
            disabled={submitting || !identifier.trim()}
          >
            {submitting ? "Đang gửi..." : "Đặt lại mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordDialog;
