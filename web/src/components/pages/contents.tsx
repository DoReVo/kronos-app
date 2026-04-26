import { Link } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { TodayParticulars } from "../today-particulars";
import { InstallCta } from "../install-cta";

const MASTHEAD_STYLE = { fontSize: "clamp(5rem,22vw,15rem)" } as const;

const NUMERALS = ["I", "II", "III", "IV", "V"] as const;

const SETTING_DATE = DateTime.fromISO(__BUILD_DATE__).toLocaleString({
  day: "numeric",
  month: "long",
});

interface Entry {
  kind: "live";
  to: "/prayer-time" | "/currency" | "/pandemic";
  title: string;
  tagline: string;
  folio: string;
}

interface Forthcoming {
  kind: "forthcoming";
  title: string;
  tagline: string;
}

interface Section {
  kicker: string;
  entries: (Entry | Forthcoming)[];
}

const sections: Section[] = [
  {
    kicker: "Applications",
    entries: [
      {
        kind: "live",
        to: "/prayer-time",
        title: "Prayer Time",
        tagline: "Daily prayer times — JAKIM zones, or astronomical from your location.",
        folio: "02",
      },
    ],
  },
  {
    kicker: "Utilities",
    entries: [
      {
        kind: "live",
        to: "/currency",
        title: "Currency Converter",
        tagline: "Live foreign exchange rates against the United States dollar.",
        folio: "04",
      },
      {
        kind: "live",
        to: "/pandemic",
        title: "SARS-CoV-2, Malaysia",
        tagline: "A standing record of cases and deaths, drawn from MoH’s linelists.",
        folio: "06",
      },
      {
        kind: "forthcoming",
        title: "Timezone Converter",
        tagline: "Forthcoming — meridians across the world's clocks.",
      },
      {
        kind: "forthcoming",
        title: "Unit Converter",
        tagline: "Forthcoming — for measure, mass, and small distances.",
      },
      {
        kind: "forthcoming",
        title: "Net Pay Calculator",
        tagline: "Forthcoming — Malaysian taxation, after subtraction.",
      },
    ],
  },
];

function useIssue() {
  const now = DateTime.now();
  const issueNumber = String(now.weekNumber).padStart(2, "0");
  const hijri = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    month: "long",
    year: "numeric",
  }).format(now.toJSDate());
  const gregorian = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now.toJSDate());
  return { issueNumber, hijri: hijri.replace(/AH$/i, "AH"), gregorian };
}

export function ContentsPage() {
  const { issueNumber, hijri, gregorian } = useIssue();

  return (
    <div className="reveal-stack flex flex-col">
      <div className="text-center pt-8 sm:pt-20">
        <div className="kicker text-ink-mute mb-12 sm:mb-16 tracking-[0.3em]">
          <span className="mx-1">Vol. I</span>
          <span className="text-ink-faint mx-2">·</span>
          <span className="mx-1">N° {issueNumber}</span>
          <span className="text-ink-faint mx-2">·</span>
          <span className="mx-1">{hijri}</span>
        </div>
      </div>

      <h1
        className="font-display italic font-normal text-center text-ink leading-[0.92] tracking-[-0.02em]"
        style={MASTHEAD_STYLE}
      >
        Kronos
      </h1>

      <div className="text-center mt-10 mb-2">
        <span className="kicker text-ink-quiet">A private almanac of utilities</span>
      </div>

      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-6 mt-6 mb-12 sm:mb-16 text-ink-mute mx-auto w-full max-w-md"
      >
        <span className="flex-1 border-t border-rule" />
        <span className="icon-[lucide--asterisk] text-2xl" />
        <span className="flex-1 border-t border-rule" />
      </div>

      <TodayParticulars />

      <div className="kicker text-ink-mute text-center mb-10 sm:mb-14 tracking-[0.35em]">
        Contents · {gregorian}
      </div>

      <div className="mx-auto w-full max-w-3xl flex flex-col gap-12 sm:gap-14">
        {sections.map((section, idx) => (
          <section key={section.kicker} className="flex flex-col">
            <div className="flex items-baseline gap-3 mb-6 pb-2 border-b border-rule">
              <span className="font-display italic text-2xl text-accent leading-none">
                {NUMERALS[idx]}
              </span>
              <span className="kicker text-ink-quiet text-sm">— {section.kicker}</span>
            </div>
            <ul className="flex flex-col gap-5">
              {section.entries.map((entry) => (
                <li key={entry.title}>
                  {entry.kind === "live" ? (
                    <Link to={entry.to} className="group block">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-2xl sm:text-3xl text-ink group-hover:text-accent transition-colors">
                          {entry.title}
                        </span>
                        <span className="flex-1 border-b border-dotted border-rule translate-y-[-0.4rem]" />
                        <span className="font-mono tabular text-sm text-ink-mute group-hover:text-accent transition-colors">
                          {entry.folio}
                        </span>
                      </div>
                      <div className="font-display italic text-base leading-snug text-ink-quiet mt-1 max-w-[36ch] text-balance">
                        {entry.tagline}
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="font-display italic text-xl sm:text-2xl text-ink-quiet">
                          {entry.title}
                        </span>
                      </div>
                      <div className="font-display italic text-sm leading-snug text-ink-mute mt-1 max-w-[40ch] text-balance">
                        {entry.tagline}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-5 mt-20 sm:mt-24 mb-10 text-ink-mute mx-auto w-full max-w-md"
      >
        <span className="flex-1 border-t border-rule" />
        <span className="icon-[lucide--asterisk] text-base" />
        <span className="flex-1 border-t border-rule" />
      </div>

      <aside className="max-w-[48ch] mx-auto">
        <div className="kicker text-ink-mute mb-4 text-center">From the Editor</div>
        <p className="font-display italic text-lg leading-[1.55] text-ink-quiet text-balance">
          <span className="float-left font-display not-italic font-normal text-[5rem] leading-[0.78] text-accent mr-3 mt-[0.35rem] select-none">
            A
          </span>
          daily reference, kept for personal use. Currency rates against the dollar; prayer times by
          JAKIM and the sun. The volume numbers, Hijri dates, and editorial chrome are a small
          affectation — the data is the part that&rsquo;s real. Pages are added when wanted, not on
          a schedule.
        </p>
      </aside>

      <div
        aria-hidden="true"
        className="mt-20 sm:mt-28 mx-auto w-full max-w-md border-t border-rule"
      />

      <footer className="pt-6 pb-6 text-center text-ink-faint flex flex-col items-center gap-3">
        <InstallCta />
        <div className="kicker flex items-center gap-2">
          <span>·</span>
          <span aria-hidden="true" className="icon-[lucide--asterisk] text-[0.7rem]" />
          <span>·</span>
          <span>Printed on the web</span>
          <span>·</span>
          <span>MMXXVI</span>
          <span>·</span>
        </div>
        <div className="marginalia">
          Edition {__APP_VERSION__} · set {SETTING_DATE}
        </div>
      </footer>
    </div>
  );
}
