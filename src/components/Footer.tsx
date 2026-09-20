const LINKS = [
  {
    title: "Game",
    items: ["Roster", "Modes", "Patch Notes", "Rankings"],
  },
  {
    title: "Community",
    items: ["Discord", "Forums", "Esports", "Creators"],
  },
  {
    title: "Company",
    items: ["Legacy", "Careers", "Press", "Support"],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-border bg-background px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <span
              className="text-3xl tracking-tight text-foreground"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Velorah<sup className="text-xs text-ember">®</sup>
            </span>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              An arena built for those who never back down. Enlist today and
              write your name into the fight.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm text-foreground">{col.title}</h4>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Velorah. All rights reserved.</span>
          <span>Enter the arena. Rise through the silence.</span>
        </div>
      </div>
    </footer>
  );
}
