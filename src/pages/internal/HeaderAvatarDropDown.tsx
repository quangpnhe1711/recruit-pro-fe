import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";

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
    navigate("/login");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="glass-surface flex cursor-pointer items-center gap-3 rounded-full border border-white/50 px-2 py-1 text-left hover:border-[rgba(182,64,44,0.35)]"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rp-primary)] text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(182,64,44,0.32)]">
            {initials}
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-[12px] font-semibold text-[var(--rp-text)]">{name}</p>
          {role ? <p className="text-[12px] text-[var(--rp-muted)]">{role}</p> : null}
        </div>
        <span className="material-symbols-outlined text-[20px] text-[var(--rp-muted)]">
          expand_more
        </span>
      </button>

      {open ? (
        <div className="glass-surface absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-[22px] border border-white/50">
          <div className="border-b border-[rgba(24,33,38,0.08)] px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--rp-text)]">{name}</p>
            {role ? <p className="text-[12px] text-[var(--rp-muted)]">{role}</p> : null}
          </div>
          <div className="py-2">
            {items.map((item) => (
              <Link
                key={item.label}
                className="flex items-center px-4 py-3 text-[12px] font-semibold text-[var(--rp-text)] hover:bg-[rgba(182,64,44,0.07)] hover:text-[var(--rp-primary)]"
                to={item.to}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="flex items-center px-4 py-3 text-[12px] font-semibold text-[var(--rp-text)] hover:bg-[rgba(182,64,44,0.07)] hover:text-[var(--rp-primary)]"
              to="/Home"
              onClick={handleLogout}
            >
              Logout
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default HeaderAvatarDropDown;
