import { Link } from "react-router-dom";

function PublicHeader() {
  return (
    <header className="bg-white sticky top-0 z-50 border-b border-[#e2dfde]">
      <nav className="flex justify-between items-center w-full px-4 md:px-[40px] h-16  ">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[30px] font-extrabold text-[#b90014] tracking-tighter">
            RecruitPro
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a
              className="text-[#b90014] font-bold border-b-2 border-[#b90014] pb-1 text-[12px] tracking-[0.05em]"
              href="#home"
            >
              Trang chủ
            </a>
            <a
              className="text-[#5f5e5e] font-medium hover:text-[#b90014] transition-colors duration-200 text-[12px] tracking-[0.05em]"
              href="#careers"
            >
              Cơ hội nghề nghiệp
            </a>
            <a
              className="text-[#5f5e5e] font-medium hover:text-[#b90014] transition-colors duration-200 text-[12px] tracking-[0.05em]"
              href="#about"
            >
              Về chúng tôi
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-6 py-2 bg-[#1A1A1A] text-white font-semibold text-[12px] border-2 border-transparent hover:bg-transparent hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all duration-300"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 bg-[white] text-[#b90014] border-2 font-semibold text-[12px] border-[#b90014] hover:bg-transparent hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all duration-300"
          >
            Đăng ký
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default PublicHeader;
