import { Link, useNavigate } from "react-router-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import type { RootState } from "../../store";
import { useI18n } from "../../i18n";

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

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 256;
const VIEWPORT_GUTTER = 16;
const MENU_OFFSET = 10;

function HeaderAvatarDropDown({
  name,
  role,
  avatarSrc,
  initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  items,
}: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: VIEWPORT_GUTTER,
  });
  const buttonId = useId();
  const menuId = useId();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentVariant = useSelector(
    (state: RootState) => state.auth.currentVariant,
  );
  const { t } = useI18n();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    function updateMenuPosition() {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const nextLeft = Math.min(
        Math.max(rect.right - MENU_WIDTH, VIEWPORT_GUTTER),
        window.innerWidth - MENU_WIDTH - VIEWPORT_GUTTER,
      );

      setMenuPosition({
        top: rect.bottom + MENU_OFFSET,
        left: nextLeft,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleLogout() {
    dispatch(logout());
    setOpen(false);
    navigate(currentVariant === "internal" ? "/internal/login" : "/login");
  }

  return (
    <>
      <button
        ref={triggerRef}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className="premium-action flex items-center gap-2.5 rounded-full border border-[#ececec] bg-white py-1 pl-1 pr-2 text-left transition-all hover:border-[#e0d4d2] hover:shadow-[var(--shadow-sm)] sm:pr-3"
        id={buttonId}
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f0353d] to-[#b90014] text-[12px] font-bold text-white">
            {initials}
          </div>
        )}
        <div className="hidden text-left sm:block">
          <p className="text-[13px] font-semibold leading-tight text-[#1a1c1c]">{name}</p>
          {role ? <p className="text-[11px] leading-tight text-[#8a8786]">{role}</p> : null}
        </div>
        <span className="material-symbols-outlined hidden text-[20px] text-[#8a8786] transition-transform duration-200 sm:block" style={open ? { transform: "rotate(180deg)" } : undefined}>
          expand_more
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              aria-labelledby={buttonId}
              className="animate-scale-in fixed z-[9999] w-64 origin-top-right overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_24px_60px_rgba(26,28,28,0.18)]"
              id={menuId}
              role="menu"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="border-b border-[#f0eceb] bg-[#faf9f8] px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#1a1c1c]">{name}</p>
                {role ? <p className="text-[11px] text-[#8a8786]">{role}</p> : null}
              </div>
              <div className="p-1.5">
                {items.map((item) => (
                  <Link
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium text-[#3a3a3a] transition-colors hover:bg-[#f6f1f1] hover:text-[#b90014]"
                    role="menuitem"
                    to={item.to}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1.5 h-px bg-[#f0eceb]" />
                <button
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium text-[#b90014] transition-colors hover:bg-[#fdeceb]"
                  role="menuitem"
                  type="button"
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  {t("auth.logout")}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default HeaderAvatarDropDown;
