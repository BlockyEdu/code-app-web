interface ProRunModalProps {
  onClose: () => void;
}

export function ProRunModal({ onClose }: ProRunModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card modal-card--pro">
        <h3>BlockyEdu Pro 完整运行</h3>
        <p>
          免费「预览」在浏览器内运行 JS、TypeScript（typescript.js）与 Python（Pyodide）。
        </p>
        <p>
          <strong>Pro</strong> 在云端 <strong>Piston</strong> 沙箱中完整编译运行，支持 Node/TS
          后端脚本、多语言与 stdin，适合真实编程与后台练习。
        </p>
        <ul>
          <li>网页端：订阅后使用「Pro」按钮（云端 Docker）</li>
          <li>桌面端：本机 Docker + Piston，代码不出设备</li>
        </ul>
        <p className="modal-tip">演示账号：<code>prolearner</code> / <code>pro123</code></p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
