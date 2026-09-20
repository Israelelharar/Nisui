import { Swords, ShieldHalf, Trophy, Users } from "lucide-react";

const MODES = [
  {
    icon: Swords,
    title: "Ranked Duels",
    desc: "1v1 skill-based matchmaking where every read, feint, and punish counts toward your climb.",
  },
  {
    icon: Users,
    title: "Crew Wars",
    desc: "Form a squad of four and battle for territory across the Velorah underground circuits.",
  },
  {
    icon: ShieldHalf,
    title: "Survival Gauntlet",
    desc: "Face an endless gauntlet of escalating opponents with only your instincts to guide you.",
  },
  {
    icon: Trophy,
    title: "Championship Season",
    desc: "Compete through weekly brackets for a shot at the seasonal title and permanent legacy skins.",
  },
];

export default function Modes() {
  return (
    <section id="modes" className="relative bg-background px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-ember">
            Modes of combat
          </span>
          <h2
            className="mt-4 text-4xl leading-tight text-foreground sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Built for every kind{" "}
            <em className="not-italic text-muted-foreground">of warrior.</em>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((mode) => (
            <div
              key={mode.title}
              className="liquid-glass flex flex-col gap-4 rounded-2xl p-7"
            >
              <div className="liquid-glass flex h-12 w-12 items-center justify-center rounded-full">
                <mode.icon size={20} className="text-ember" />
              </div>
              <h3
                className="text-xl text-foreground"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {mode.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {mode.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
