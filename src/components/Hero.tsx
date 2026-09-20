import { Button } from "@/components/ui/button";

const VIDEO_SRC =
  "https://videos.pexels.com/video-files/5752181/5752181-uhd_2560_1440_25fps.mp4";
const POSTER_SRC =
  "https://images.pexels.com/videos/5752181/pexels-photo-5752181.jpeg?auto=compress&w=1600&h=900&dpr=1";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-background"
    >
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={POSTER_SRC}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* subtle scrim so the type stays legible without killing depth */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 pb-40 pt-32 py-[90px] text-center">
        <span className="animate-fade-rise liquid-glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-ember animate-ember-pulse" />
          Season III — Now Live
        </span>

        <h1
          className="animate-fade-rise max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground sm:text-7xl md:text-8xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <em className="not-italic text-muted-foreground">legends rise</em>{" "}
          through <em className="not-italic text-muted-foreground">the silence.</em>
        </h1>

        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We're forging an arena for relentless fighters, cunning tacticians, and
          quiet warriors. Amid the roar of battle, we build a stage for pure
          skill and unstoppable will.
        </p>

        <Button
          variant="glass"
          size="lg"
          className="animate-fade-rise-delay-2 mt-12 cursor-pointer rounded-full px-14 py-5 text-base text-foreground hover:scale-[1.03]"
        >
          Enter the Arena
        </Button>
      </div>
    </section>
  );
}
