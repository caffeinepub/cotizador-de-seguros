import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

let _clientPromise: Promise<backendInterface> | null = null;

export function getBackendClient(): Promise<backendInterface> {
  if (!_clientPromise) {
    _clientPromise = createActorWithConfig();
  }
  return _clientPromise;
}

// Proxy that lazily resolves backend calls
export const backendClient: backendInterface = new Proxy(
  {} as backendInterface,
  {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const client = await getBackendClient();
        const fn = (
          client as unknown as Record<string, (...a: unknown[]) => unknown>
        )[prop as string];
        return fn(...args);
      };
    },
  },
);
