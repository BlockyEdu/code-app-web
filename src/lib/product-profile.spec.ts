import { expect, test } from "@rstest/core";
import { PRODUCT_PROFILE, profileFeatures } from "./product-profile";

test("default profile is maker_global", () => {
  expect(PRODUCT_PROFILE).toBe("maker_global");
});

test("maker_global hides Classroom and never allows factory orders", () => {
  const f = profileFeatures("maker_global");
  expect(f.showClassroomNav).toBe(false);
  expect(f.showLaunchNav).toBe(true);
  expect(f.canPlaceFactoryOrder).toBe(false);
  expect(f.canMarkLaunchable).toBe(true);
});

test("youth cannot order or mark launchable", () => {
  const f = profileFeatures("youth");
  expect(f.showLaunchNav).toBe(false);
  expect(f.canPlaceFactoryOrder).toBe(false);
  expect(f.canMarkLaunchable).toBe(false);
});
