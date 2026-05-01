import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "প্রতিফলন (Ray Optics)" },
  { to: "/refraction", label: "প্রতিসরণ ও বিচ্ছুরণ" },
];

const SiteNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed top-3 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-md">
      <ul className="flex gap-1 text-sm">
        {links.map((l) => {
          const active = pathname === l.to;
          return (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`block rounded-full px-4 py-1.5 transition-colors ${
                  active
                    ? "bg-white text-black font-semibold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SiteNav;
