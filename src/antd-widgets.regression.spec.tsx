/**
 * @rstest-environment jsdom
 *
 * Core antd widgets used by the studio shell. Runs without a dev server so the
 * 6.6.4 bump can be checked in unit CI.
 */
import { afterEach, expect, test } from "@rstest/core";
import { ConfigProvider, Form, Input, Select, Switch, Table, version } from "antd";
/** rstest compiles this file with classic JSX. */
// biome-ignore lint/correctness/noUnusedImports: classic JSX runtime in unit tests
import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

function atLeast(current: string, min: string) {
  const left = current.split(".").map(Number);
  const right = min.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

function installDomShims() {
  if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  root?.unmount();
  host?.remove();
  root = null;
  host = null;
});

async function mount(node: ReactNode) {
  installDomShims();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(node);
  });
}

test("antd 6.6.4 form, select, switch, and table mount", async () => {
  expect(atLeast(version, "6.6.4")).toBe(true);
  await mount(
    <ConfigProvider>
      <Form>
        <Form.Item label="Name">
          <Input defaultValue="Ada" />
        </Form.Item>
        <Form.Item label="Role">
          <Select
            defaultValue="admin"
            options={[
              { label: "Admin", value: "admin" },
              { label: "Viewer", value: "viewer" },
            ]}
          />
        </Form.Item>
        <Form.Item label="Enabled">
          <Switch defaultChecked />
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        pagination={false}
        dataSource={[{ id: "1", name: "Ada" }]}
        columns={[{ title: "Student", dataIndex: "name" }]}
      />
    </ConfigProvider>,
  );

  expect(host?.querySelector("input")?.value).toBe("Ada");
  expect(host?.textContent).toContain("Student");
  expect(host?.querySelector(".ant-switch-checked")).toBeTruthy();
  expect(host?.querySelector(".ant-select")).toBeTruthy();
});
