import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = { "@": fileURLToPath(new URL("./", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    fileParallelism: false,
    projects: [
      {
        resolve: { alias },
        test: { name: "dominio", include: ["lib/**/*.test.ts"], environment: "node" },
      },
      {
        resolve: { alias },
        test: {
          name: "regole",
          include: ["tests/regole/**/*.test.ts"],
          environment: "node",
          testTimeout: 20000,
        },
      },
    ],
  },
});
