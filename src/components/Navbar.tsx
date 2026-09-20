import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Arena", href: "#home", active: true },
  { label: "Roster", href: "#roster" },
  { label: "Modes", href: "#modes" },
  { label: "Legacy", href: "#about" },
  { label: "Enlist", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-sm" : ""
      }`}
    >
      <nav className="relative z-10 mx-auto flex max-w-7xl flex-row items-center justify-between px-6 py-6 md:px-8">
        <a href="#home" className="flex items-baseline gap-1 text-foreground">
          <span
            className="text-3xl tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Velorah
          </span>
          <sup className="text-xs text-ember">®</sup>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                link.active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button variant="glass" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
            Enter the Arena
          </Button>
        </div>

        <button
          className="liquid-glass flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="liquid-glass mx-4 flex flex-col gap-4 rounded-2xl p-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-sm transition-colors ${
                link.active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
          <Button variant="glass" className="w-full rounded-full py-2.5 text-sm">
            Enter the Arena
          </Button>
        </div>
      )}
    </header>
  );
}
