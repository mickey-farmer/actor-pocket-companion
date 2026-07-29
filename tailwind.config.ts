import type { Config } from 'tailwindcss';

// Reads each color from a "R G B" CSS variable so the actual values can be
// swapped at runtime (via the [data-theme] attribute set in globals.css)
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
const stageColors = {
  // Values live in app/globals.css under [data-theme='...'] blocks — see
  // ThemePicker/ThemeContext for how the active theme is chosen.
  bg: withOpacity('--stage-bg-rgb'),
  panel: withOpacity('--stage-panel-rgb'),
  panel2: withOpacity('--stage-panel2-rgb'),
  border: withOpacity('--stage-border-rgb'),
  text: withOpacity('--stage-text-rgb'),
  accent: withOpacity('--stage-accent-rgb'),
  accentDark: withOpacity('--stage-accentDark-rgb'),
  accent2: withOpacity('--stage-accent2-rgb'),
  // Text color for content sitting on top of a bg-stage-accent surface
  // (buttons, active tabs, chat bubbles). Kept separate from stage.bg
  // because in the Light theme the page background is light but
  // on-accent text still needs to be dark/white.
  onAccent: withOpacity('--stage-onAccent-rgb'),
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
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
