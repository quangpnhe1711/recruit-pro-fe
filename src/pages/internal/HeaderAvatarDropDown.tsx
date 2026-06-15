import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import type { RootState } from "../../store";

type AvatarMenuItem = {
  label: string;
  to: string;
};

type AvatarMenuProps = {
  name: string;
  role?: string;
  avatarSrc?: string;
  initials?: string;
  items: AvatarMenuItem[];
};

function HeaderAvatarDropDown({
  name,
  role,
  avatarSrc,
  initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  items,
}: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentVariant = useSelector((state: RootState) => state.auth.currentVariant);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    dispatch(logout());
    setOpen(false);
    navigate(currentVariant === "internal" ? "/internal/login" : "/login");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-3 rounded-full border border-[#e2dfde] bg-white px-2 py-1 text-left transition-colors hover:border-[#b90014] cursor-pointer"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        {avatarSrc ? (
          <img
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
            src={avatarSrc}
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b90014] text-[12px] font-bold text-white">
            {initials}
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-[12px] font-semibold text-[#1a1c1c]">{name}</p>
          {role ? <p className="text-[12px] text-[#5f5e5e]">{role}</p> : null}
        </div>
        <span className="material-symbols-outlined text-[20px] text-[#5f5e5e]">
          expand_more
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[#e2dfde] bg-white shadow-sm">
          <div className="border-b border-[#e2dfde] px-4 py-3">
            <p className="text-[12px] font-semibold text-[#1a1c1c]">{name}</p>
            {role ? <p className="text-[12px] text-[#5f5e5e]">{role}</p> : null}
          </div>
          <div className="py-2">
            {items.map((item) => (
              <Link
                key={item.label}
                className="flex items-center px-4 py-3 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3] hover:text-[#b90014]"
                to={item.to}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="flex items-center px-4 py-3 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3] hover:text-[#b90014]"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default HeaderAvatarDropDown;
