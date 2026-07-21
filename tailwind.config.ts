import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        aia: { red: "#D31145", navy: "#00205B", slate: "#4A5568" },
      },
    },
  },
  plugins: [],
};

export default config;
