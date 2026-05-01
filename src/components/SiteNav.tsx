import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "প্রতিফলন (Ray Optics)", dark: false },
  { to: "/refraction", label: "প্রতিসরণ ও বিচ্ছুরণ", dark: true },
];

const SiteNav = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = pathname === "/refraction";

  const borderColor = isDark ? "border-white/10" : "border-gray-200";
  const bgColor = isDark ? "bg-black/60" : "bg-white/80";
  const textColor = isDark ? "text-white/70" : "text-gray-600";
  const hoverColor = isDark ? "hover:text-white hover:bg-white/10" : "hover:text-gray-900 hover:bg-gray-100";
  const activeBg = "bg-white text-black font-semibold";
  const activeDarkBg = "bg-white text-black font-semibold";

  return (
    <nav className={`w-full border-b ${borderColor} ${bgColor} backdrop-blur-md`}>
      <div className="mx-auto max-w-6xl px-4">
        {/* Desktop tabs */}
        <ul className="hidden md:flex gap-1 py-2">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`block rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? (isDark ? activeDarkBg : activeBg)
                      : `${textColor} ${hoverColor}`
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile: hamburger menu */}
        <div className="flex md:hidden items-center justify-between py-2">
          <Link
            to={pathname}
            className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {links.find((l) => l.to === pathname)?.label}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`rounded-lg p-2 transition-colors ${isDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? (isDark ? activeDarkBg : activeBg)
                      : `${textColor} ${hoverColor}`
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default SiteNav;
