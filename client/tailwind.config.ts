/** Note: Tailwind v4 ignores this file at runtime; kept for reference only. */
import type { Config } from "tailwindcss";

export default {
 content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1D5FFF",
          orange: "#FF7A00",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
