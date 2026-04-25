import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { DateTime } from "luxon";
import { itemVariants } from "../page-frame";

const MASTHEAD_STYLE = { fontSize: "clamp(5rem,22vw,15rem)" } as const;

interface Entry {
  kind: "live";
  to: "/prayer-time" | "/currency";
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
        tagline: "A daily observance, set by JAKIM and the sun.",
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
        tagline: "Live foreign exchange against the United States dollar.",
        folio: "04",
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
    <div className="flex flex-col">
      <motion.div variants={itemVariants} className="text-center pt-4 sm:pt-12">
        <div className="kicker text-ink-mute mb-6 sm:mb-8 tracking-[0.3em]">
          <span className="mx-1">Vol. I</span>
          <span className="text-ink-faint mx-2">·</span>
          <span className="mx-1">N° {issueNumber}</span>
          <span className="text-ink-faint mx-2">·</span>
          <span className="mx-1">{hijri}</span>
        </div>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="font-display italic font-normal text-center text-ink leading-[0.92] tracking-[-0.02em]"
        style={MASTHEAD_STYLE}
      >
        Kronos
      </motion.h1>

      <motion.div variants={itemVariants} className="text-center mt-6 mb-2">
        <span className="kicker text-ink-quiet">A private almanac of utilities</span>
      </motion.div>

      <motion.div
        variants={itemVariants}
        aria-hidden="true"
        className="flex items-center justify-center gap-6 mt-6 mb-12 sm:mb-16 text-ink-mute mx-auto w-full max-w-md"
      >
        <span className="flex-1 border-t border-rule" />
        <span className="icon-[lucide--asterisk] text-2xl" />
        <span className="flex-1 border-t border-rule" />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="kicker text-ink-mute text-center mb-10 sm:mb-14 tracking-[0.3em]"
      >
        Contents · {gregorian}
      </motion.div>

      <div className="flex flex-col gap-12 sm:gap-14">
        {sections.map((section) => (
          <motion.section variants={itemVariants} key={section.kicker} className="flex flex-col">
            <div className="kicker text-ink-mute mb-5 pb-2 border-b border-rule-soft">
              {section.kicker}
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
                      <div className="font-display italic text-base text-ink-quiet mt-1 max-w-[36ch]">
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
                      <div className="font-display italic text-sm text-ink-mute mt-1 max-w-[40ch]">
                        {entry.tagline}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      <motion.aside
        variants={itemVariants}
        className="mt-16 sm:mt-20 max-w-[44ch] mx-auto text-center"
      >
        <div className="kicker text-ink-mute mb-3">From the Editor</div>
        <p className="font-display italic text-lg leading-relaxed text-ink-quiet">
          This is a small private periodical of personal tools — an experiment in treating utilities
          like artefacts, set in type and bound between dates. Pages are added when needed, never to
          a schedule.
        </p>
      </motion.aside>

      <motion.footer
        variants={itemVariants}
        className="mt-20 sm:mt-28 pb-4 text-center kicker text-ink-faint flex items-center justify-center gap-2"
      >
        <span>·</span>
        <span aria-hidden="true" className="icon-[lucide--asterisk] text-[0.7rem]" />
        <span>·</span>
        <span>Printed on the web</span>
        <span>·</span>
        <span>MMXXVI</span>
        <span>·</span>
      </motion.footer>
    </div>
  );
}
