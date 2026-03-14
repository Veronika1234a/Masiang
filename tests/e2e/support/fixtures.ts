import { expect, test as base } from "@playwright/test";
import {
  MockSupabaseBackend,
  createBaseMockState,
} from "./mockSupabase";

export const test = base.extend<{
  backend: MockSupabaseBackend;
}>({
  backend: async ({ context }, runBackend) => {
    const backend = new MockSupabaseBackend(createBaseMockState());
    await backend.install(context);
    await runBackend(backend);
  },
});

export { expect };
