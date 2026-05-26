function Footer() {
  return (
    <footer className="border-t border-[#e2dfde] bg-[#f3f3f3]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="text-[16px] font-semibold text-[#1a1c1c]">RecruitPro</p>
          <p className="text-[12px] text-[#5f5e5e]">© 2024 RecruitPro Internal. All rights reserved.</p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]" href="#">
            Security Disclosure
          </a>
          <a className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]" href="#">
            Privacy Policy
          </a>
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
            <span className="h-2 w-2 rounded-full bg-[#0f9d58]" />
            System Status: Operational
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
