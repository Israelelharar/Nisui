import fighterKai from "@/assets/fighter-kai.jpg";
import fighterSeraphine from "@/assets/fighter-seraphine.jpg";
import fighterMarcus from "@/assets/fighter-marcus.jpg";
import fighterYuki from "@/assets/fighter-yuki.jpg";

const FIGHTERS = [
  {
    name: "Kai Ronin",
    style: "Muay Boran",
    tag: "The Burning Fist",
    image: fighterKai,
  },
  {
    name: "Seraphine Vale",
    style: "Shadow Blade",
    tag: "Silent Edge",
    image: fighterSeraphine,
  },
  {
    name: "Marcus Drayce",
    style: "Heavyweight Brawl",
    tag: "The Wall",
    image: fighterMarcus,
  },
  {
    name: "Yuki Amasawa",
    style: "Kenjutsu Strike",
    tag: "Storm Cutter",
    image: fighterYuki,
  },
];

export default function Roster() {
  return (
    <section id="roster" className="relative bg-background px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-ember">
              Choose your fighter
            </span>
            <h2
              className="mt-4 text-4xl leading-tight text-foreground sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Four disciplines.{" "}
              <em className="not-italic text-muted-foreground">One arena.</em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Every roster member is built with a distinct combat identity —
            master their rhythm, punish their openings, and claim the crown.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FIGHTERS.map((fighter) => (
            <div
              key={fighter.name}
              className="group liquid-glass relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <img
                src={fighter.image}
                alt={fighter.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ember">
                  {fighter.tag}
                </span>
                <h3
                  className="mt-1 text-2xl text-foreground"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {fighter.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fighter.style}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
