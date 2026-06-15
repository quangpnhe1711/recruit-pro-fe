import { useSelector } from "react-redux";
import { RootState } from "../../../store";

function Footer() {
  const authState = useSelector((state: RootState) => state.auth);

  return (
    <footer className={`border-t border-[#e2dfde] bg-gray-300 ${authState.isAuthenticated ? "mt-12" : ""}`}>
      <div className={`${authState.isAuthenticated ? "w-full" : "mx-auto max-w-[1440px]"} flex flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-10`}>
        <div>
          <p className="text-[16px] font-semibold text-[#1a1c1c]">RecruitPro</p>
          <p className="text-[12px] text-[#5f5e5e]">
            © 2024 RecruitPro Internal. Đã đăng ký mọi quyền.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a
            className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
            href="#"
          >
            Công bố bảo mật
          </a>
          <a
            className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
            href="#"
          >
            Chính sách riêng tư
          </a>
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
            <span className="h-2 w-2 rounded-full bg-[#0f9d58]" />
            Trạng thái hệ thống: Hoạt động ổn định
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
