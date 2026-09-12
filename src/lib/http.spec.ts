import { afterEach, describe, expect, it } from "@rstest/core";
import { clearHttpInflight, httpRequest, setUnauthorizedHandler, UnauthorizedError } from "./http";
import { useLocaleStore } from "./locale-store";

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function stubLocalStorage(initial?: Record<string, string>) {
  const data = new Map<string, string>(Object.entries(initial ?? {}));
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  return data;
}

describe("httpRequest coalescing", () => {
  afterEach(() => {
    clearHttpInflight();
    setUnauthorizedHandler(() => {});
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

  it("extracts nested Nest error messages", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          statusCode: 503,
          error: "Service Unavailable",
          message: { code: "AI_NOT_CONFIGURED", message: "未配置模型密钥" },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    await expect(httpRequest("/ai/chat", { method: "POST", body: "{}" })).rejects.toThrow(
      "未配置模型密钥",
    );
  });

  it("sends Accept-Language from the UI locale", async () => {
    stubLocalStorage();
    useLocaleStore.getState().setLocale("en-US");
    let accept = "";
    globalThis.fetch = (async (_input, init) => {
      accept = new Headers(init?.headers).get("Accept-Language") ?? "";
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await httpRequest("/health");
    expect(accept).toBe("en-US");

    useLocaleStore.getState().setLocale("zh-CN");
    await httpRequest("/health?reset=1");
    expect(accept).toBe("zh-CN");
  });
});

describe("httpRequest JWT refresh", () => {
  afterEach(() => {
    clearHttpInflight();
    setUnauthorizedHandler(() => {});
    // @ts-expect-error test stub cleanup
    globalThis.fetch = undefined;
  });

  it("retries the original path once after refresh 200", async () => {
    const tokens = stubLocalStorage({ blockyedu_token: "old-token" });
    let unauthorized = 0;
    setUnauthorizedHandler(() => {
      unauthorized += 1;
    });

    const original: string[] = [];
    const refresh: string[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = urlOf(input);
      if (url.includes("/auth/refresh")) {
        refresh.push(url);
        return new Response(JSON.stringify({ accessToken: "new-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      original.push(url);
      if (original.length === 1) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await httpRequest<{ ok: boolean }>("/projects");
    expect(result).toEqual({ ok: true });
    expect(original).toHaveLength(2);
    expect(refresh).toHaveLength(1);
    expect(unauthorized).toBe(0);
    expect(tokens.get("blockyedu_token")).toBe("new-token");
  });

  it("does not treat refresh 501 as success", async () => {
    stubLocalStorage({ blockyedu_token: "old-token" });
    let unauthorized = 0;
    setUnauthorizedHandler(() => {
      unauthorized += 1;
    });

    let originalCalls = 0;
    let refreshCalls = 0;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = urlOf(input);
      if (url.includes("/auth/refresh")) {
        refreshCalls += 1;
        return new Response(JSON.stringify({ message: "当前令牌无法由本服务刷新" }), {
          status: 501,
          headers: { "Content-Type": "application/json" },
        });
      }
      originalCalls += 1;
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }) as typeof fetch;

    await expect(httpRequest("/projects")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(originalCalls).toBe(1);
    expect(refreshCalls).toBe(1);
    expect(unauthorized).toBe(1);
  });

  it("does not refresh when skipAuthHandlers is set", async () => {
    stubLocalStorage({ blockyedu_token: "old-token" });
    let refreshCalls = 0;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (urlOf(input).includes("/auth/refresh")) refreshCalls += 1;
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }) as typeof fetch;

    await expect(httpRequest("/projects", { skipAuthHandlers: true })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(refreshCalls).toBe(0);
  });
});
