import { afterEach, describe, expect, it } from "@rstest/core";
import { clearHttpInflight, httpRequest } from "./http";

describe("httpRequest coalescing", () => {
  afterEach(() => {
    clearHttpInflight();
    // @ts-expect-error test stub cleanup
    globalThis.fetch = undefined;
  });

  it("shares one network call for concurrent identical GETs", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const [a, b] = await Promise.all([
      httpRequest<{ ok: boolean }>("/health"),
      httpRequest<{ ok: boolean }>("/health"),
    ]);

    expect(calls).toBe(1);
    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
  });

  it("does not coalesce POST unless requested", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ n: calls }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await Promise.all([
      httpRequest("/x", { method: "POST", body: "{}" }),
      httpRequest("/x", { method: "POST", body: "{}" }),
    ]);
    expect(calls).toBe(2);

    calls = 0;
    await Promise.all([
      httpRequest("/y", { method: "POST", body: "{}", coalesce: true }),
      httpRequest("/y", { method: "POST", body: "{}", coalesce: true }),
    ]);
    expect(calls).toBe(1);
  });
});
