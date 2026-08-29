/** Product Profile switches. Phase 0–4 only ship `maker_global`. */

export type ProductProfile =
  | "maker_global"
  | "youth"
  | "classroom"
  | "china_commerce"
  | "enterprise";

export const PRODUCT_PROFILE: ProductProfile =
  (import.meta.env.VITE_PRODUCT_PROFILE as ProductProfile | undefined) || "maker_global";

export type ProfileFeatures = {
  showClassroomNav: boolean;
  showLaunchNav: boolean;
  /** Real factory orders stay off until invite Phase 4; youth never. */
  canPlaceFactoryOrder: boolean;
  canMarkLaunchable: boolean;
};

export function profileFeatures(profile: ProductProfile = PRODUCT_PROFILE): ProfileFeatures {
  const isYouth = profile === "youth";
  return {
    showClassroomNav: profile === "classroom" || profile === "enterprise",
    showLaunchNav: !isYouth,
    canPlaceFactoryOrder: false,
    canMarkLaunchable: !isYouth,
  };
}
