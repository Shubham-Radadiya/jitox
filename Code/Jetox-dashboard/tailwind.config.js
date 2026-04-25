/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        neutral: "var(--color-neutral)",
        light: "var(--color-light)",
        dark: "var(--color-dark)",
        white: "var(--color-white)",
        blue: "var(--color-blue)",
        lightblue: "var(--color-lightblue)",
        light_border: "var(--color-light-border)",
        main_bg: "var(--color-main-bg)",
        gray: "var(--color-gray)",
        gray2: "var(--color-gray2)",
        headBg: "var(--color-headBg)",
        rowBg: "var(--color-rowBg)",
        yellow: "var(--color-yellow)",
        red: "var(--color-red)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
    },
  },
  plugins: [],
};
