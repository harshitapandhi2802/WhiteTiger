/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — SECTIONS NOT YET OPEN

   Sections listed here show a "Coming soon" badge and open a
   coming-soon dialog instead of the section. Their data isn't
   launch-ready yet. To open one, remove it from this list.
   ═══════════════════════════════════════════════════════════════ */

export const COMING_SOON_SECTIONS: Record<string, { label: string; blurb: string }> = {
  realestate: {
    label: "Real Estate",
    blurb: "City and locality insights, housing trends and REITs.",
  },
  international: {
    label: "Global Markets",
    blurb: "World indices and the top stocks in each country.",
  },
};

export function isComingSoon(section: string): boolean {
  return section in COMING_SOON_SECTIONS;
}
