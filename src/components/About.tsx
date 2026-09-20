import arenaBg from "@/assets/arena-bg.jpg";
import { Button } from "@/components/ui/button";

const STATS = [
  { value: "4.2M+", label: "Fighters enlisted" },
  { value: "180+", label: "Nations represented" },
  { value: "60fps", label: "Combat precision" },
  { value: "24/7", label: "Live arenas" },
];

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-background px-6 py-28">
      <img
        src={arenaBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-ember">
          The legacy
        </span>
        <h2
          className="mx-auto mt-4 max-w-3xl text-4xl leading-tight text-foreground sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Every scar tells a story.{" "}
          <em className="not-italic text-muted-foreground">
            Every fight forges one.
          </em>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Velorah was built by fight fans, for fight fans — a living arena
          where physics-driven combat, real stakes, and unforgettable
          rivalries collide. No shortcuts. No mercy. Just the fight.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span
                className="text-3xl text-foreground sm:text-4xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {stat.value}
              </span>
              <span className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <Button
          variant="glass"
          size="lg"
          className="mt-14 cursor-pointer rounded-full px-14 py-5 text-base text-foreground hover:scale-[1.03]"
        >
          Join the Roster
        </Button>
      </div>
    </section>
  );
}
