import type { Config } from 'tailwindcss';

// Reads each color from a "R G B" CSS variable so the actual values can be
// swapped at runtime (via the [data-theme] attribute set in app/globals.css)
// without touching any component class names. Also preserves Tailwind's
// opacity modifiers (e.g. bg-stage-accent/20) per Tailwind's documented
// CSS-variable color pattern.
function withOpacity(varName: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${varName}))`;
    }
    return `rgb(var(${varName}) / ${opacityValue})`;
  };
}

// Tailwind's runtime config resolver supports functions for color values
// (that's how its own docs show CSS-variable + opacity-modifier support),
// but the `Config` type shipped with tailwindcss@3.4.7 only declares color
// values as strings — the function form is a real, working runtime feature
// that its own .d.ts just doesn't model. Cast at this one boundary so the
// rest of the file stays properly typed.
//
// Values live in app/globals.css under [data-theme='...'] blocks, which is
// also where each token is documented. Components should use ONLY these —
// reaching for a raw Tailwind palette class (text-slate-400 and friends)
// hardcodes a dark-theme grey and breaks the Light theme, which is exactly
// the bug this token set exists to prevent.
const stageColors = {
  bg: withOpacity('--stage-bg-rgb'),
  panel: withOpacity('--stage-panel-rgb'),
  panel2: withOpacity('--stage-panel2-rgb'),
  border: withOpacity('--stage-border-rgb'),
  borderStrong: withOpacity('--stage-borderStrong-rgb'),
  text: withOpacity('--stage-text-rgb'),
  muted: withOpacity('--stage-muted-rgb'),
  subtle: withOpacity('--stage-subtle-rgb'),
  accent: withOpacity('--stage-accent-rgb'),
  accentHover: withOpacity('--stage-accentHover-rgb'),
  accentSoft: withOpacity('--stage-accentSoft-rgb'),
  // Text color for content sitting on top of a bg-stage-accent surface
  // (buttons, active tabs, chat bubbles). Kept separate from stage.bg
  // because in the Light theme the page background is light but on-accent
  // text still needs to be white.
  onAccent: withOpacity('--stage-onAccent-rgb'),
  success: withOpacity('--stage-success-rgb'),
  warning: withOpacity('--stage-warning-rgb'),
  danger: withOpacity('--stage-danger-rgb'),
} as unknown as Record<string, string>;

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        stage: stageColors,
      },
      fontFamily: {
        // UI chrome. Previously the whole app ran in Georgia, which is most
        // of why it read as dated — serif nav and serif buttons.
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Inter',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Screenplay content only — see the .script-text rule in globals.css.
        script: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Courier New',
          'monospace',
        ],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
      boxShadow: {
        // Deliberately restrained — this register uses borders for structure
        // and reserves shadow for things that genuinely float.
        pop: '0 8px 24px -8px rgb(0 0 0 / 0.35), 0 2px 6px -2px rgb(0 0 0 / 0.2)',
      },
      // Safe-area insets so the mobile tab bar clears the iPhone home bar.
      spacing: {
        safe: 'env(safe-area-inset-bottom, 0px)',
      },
    },
  },
  plugins: [],
};

export default config;
