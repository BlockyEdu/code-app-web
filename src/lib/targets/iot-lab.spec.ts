import { describe, expect, it } from "@rstest/core";
import {
  createIotWorld,
  evaluateIotAssertions,
  iotApi,
  starterIotCode,
} from "./iot-lab";
import { runTargetProgram } from "./runtime";

function noopGuard() {}

describe("IoT lab simulation", () => {
  it("closes the window on rain and denies open", () => {
    const world = createIotWorld("smart-window", { rain: 1, temperature: 22, position: 40 });
    const iot = iotApi(world, noopGuard, () => undefined);
    iot.evaluateScene("win-rain-close");
    iot.command("open");
    const assertions = evaluateIotAssertions(world, ["rain-close", "rain-deny-open"]);
    expect(assertions.every((a) => a.ok)).toBe(true);
  });

  it("vents on heat when dry", () => {
    const world = createIotWorld("smart-window", { rain: 0, temperature: 32, position: 0 });
    iotApi(world, noopGuard, () => undefined).evaluateScene("win-heat-vent");
    expect(evaluateIotAssertions(world, ["heat-vent"])[0]?.ok).toBe(true);
  });

  it("irrigates dry soil, skips rain, and stops a dry-run pump", () => {
    const soil = createIotWorld("agri-irrigation", { soil: 18, rain: 0, flow: 1.2 });
    iotApi(soil, noopGuard, () => undefined).evaluateScene("irr-soil");
    expect(evaluateIotAssertions(soil, ["soil-irrigate"])[0]?.ok).toBe(true);

    const rain = createIotWorld("agri-irrigation", { soil: 18, rain: 1, flow: 1.2 });
    iotApi(rain, noopGuard, () => undefined).evaluateScene("irr-rain-skip");
    expect(evaluateIotAssertions(rain, ["rain-skip"])[0]?.ok).toBe(true);

    const dry = createIotWorld("agri-irrigation", { soil: 40, rain: 0, flow: 0, pump: 1 });
    iotApi(dry, noopGuard, () => undefined).evaluateScene("irr-dry-run");
    expect(evaluateIotAssertions(dry, ["dry-run-stop"])[0]?.ok).toBe(true);
  });

  it("aerates, sprays on heat, and denies spray at low water", () => {
    const aerate = createIotWorld("agri-pond", { do_mgl: 3.1, level_pct: 80, temp: 24 });
    iotApi(aerate, noopGuard, () => undefined).evaluateScene("pond-aerate");
    expect(evaluateIotAssertions(aerate, ["low-do-aerate"])[0]?.ok).toBe(true);

    const spray = createIotWorld("agri-pond", { do_mgl: 6, level_pct: 80, temp: 31 });
    iotApi(spray, noopGuard, () => undefined).evaluateScene("pond-spray");
    expect(evaluateIotAssertions(spray, ["heat-spray"])[0]?.ok).toBe(true);

    const low = createIotWorld("agri-pond", { do_mgl: 6, level_pct: 10, temp: 31 });
    iotApi(low, noopGuard, () => undefined).command("sprayOn");
    expect(evaluateIotAssertions(low, ["low-level-deny-spray"])[0]?.ok).toBe(true);
  });

  it("runs generated window starter without network APIs", () => {
    const result = runTargetProgram({
      code: starterIotCode("smart-window"),
      kind: "iot",
      packSlug: "smart-window",
    });
    expect(result.status).toBe("success");
    expect(result.finalState.iot?.packSlug).toBe("smart-window");
    expect(result.finalState.iot?.assertions.some((a) => a.id === "rain-deny-open" && a.ok)).toBe(true);
  });
});
