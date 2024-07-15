import { useAuthStore } from '../lib/auth-store';

export function AuthBanner() {
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);

  if (user) return null;

  return (
    <div className="auth-banner">
      <span>登录后可保存项目、同步课程并使用 AI 助手</span>
      <button type="button" className="btn-ghost" onClick={openLoginPrompt}>
        立即登录
      </button>
    </div>
  );
}
