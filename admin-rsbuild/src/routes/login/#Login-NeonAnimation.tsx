import { NeonBar, NeonSidebar } from './#styles';

/** 三组霓虹灯颜色：蓝、青、紫 */
const NEON_COLORS = ['#3b6bff', '#6ce6ff', '#a78bfa'];

/** 左侧栏三组错开 delay 的霓虹灯动画条 */
function LoginNeonAnimation() {
  return (
    <NeonSidebar aria-hidden="true">
      {NEON_COLORS.map((color, index) => {
        return (
          <NeonBar
            key={color}
            $color={color}
            $delay={index * 0.8}
          />
        );
      })}
    </NeonSidebar>
  );
}

export default LoginNeonAnimation;
