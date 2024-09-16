import { PLAN_LABELS } from '../lib/membership-types';
import { useMembershipStore } from '../lib/membership-store';

interface ProRunModalProps {
  onClose: () => void;
}

export function ProRunModal({ onClose }: ProRunModalProps) {
  const plan = useMembershipStore((s) => s.effectivePlan)();
  const trialActive = useMembershipStore((s) => s.trialActive)();
  const trialEndsAt = useMembershipStore((s) => s.trialEndsAt)();
  const eduMembershipUrl =
    import.meta.env.VITE_EDU_APP_URL?.replace(/\/$/, '') ||
    import.meta.env.VITE_EDU_LOGIN_URL?.replace(/\/login\/?$/, '') ||
    'http://localhost:18082';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card modal-card--pro">
        <h3>升级 Pro / Ultra / Enterprise</h3>
        <p>
          免费「预览」在浏览器内运行 JS、TypeScript（typescript.js）与 Python（Pyodide）。
        </p>
        <p>
          <strong>Pro</strong> 及以上在云端 <strong>Piston</strong> 沙箱完整编译运行；当前档位：
          <strong> {PLAN_LABELS[plan]}</strong>
          {trialActive && trialEndsAt ? `（Trial 至 ${trialEndsAt}）` : ''}
        </p>
        <ul>
          <li>Pro：云端代码执行 + AI Copilot</li>
          <li>Ultra：Pro + AI Tutor</li>
          <li>Enterprise：合同 Seat + 私有 License（不绕过资源 ACL）</li>
        </ul>
        <p className="modal-tip">
          演示账号仍可用：<code>prolearner</code> / <code>pro123</code>（legacy）。正式环境请走权益升级。
        </p>
        <div className="modal-actions">
          <a className="btn-primary" href={`${eduMembershipUrl}/membership`}>
            查看套餐 / 升级
          </a>
          <button type="button" className="btn-ghost" onClick={onClose}>
            稍后
          </button>
        </div>
      </div>
    </div>
  );
}
