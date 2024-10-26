import terser from "@rollup/plugin-terser";

export default {
  input: "dist/src/index.js",
  output: [
    {
      name: "thueInterpreter",
      file: "dist/thue-interpreter.min.js",
      format: "umd",
      plugins: [terser()],
    },
  ],
};
