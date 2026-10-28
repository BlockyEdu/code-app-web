import Icon from "@ant-design/icons";
import type { ComponentProps, ComponentType, SVGProps } from "react";

type AntdIconProps = ComponentProps<typeof Icon>;

/**
 * Wrap a React SVG component as an Ant Design Icon (same API as @ant-design/icons).
 *
 * @example
 * const FooIcon = createAntdIcon(FooSvg);
 * <Button icon={<FooIcon />} />
 */
export function createAntdIcon(Svg: ComponentType<SVGProps<SVGSVGElement>>) {
  const AntdIcon = (props: AntdIconProps) => <Icon component={Svg} {...props} />;
  AntdIcon.displayName = `AntdIcon(${Svg.displayName ?? Svg.name ?? "Svg"})`;
  return AntdIcon;
}
