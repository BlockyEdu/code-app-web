export function LegalTermsPage({ product }: { product: string }) {
  return (
    <article style={{ maxWidth: 720, margin: "32px auto", padding: "0 20px 64px", lineHeight: 1.65 }}>
      <p>
        <a href="/login">← 登录</a>
      </p>
      <h1>{product} 用户协议</h1>
      <p>
        使用本产品须同时同意 LuminaryWorks 通用服务条款。本产品由 LuminaryWorks（启明工坊）及其关联方、贡献者与开发者按「现状」提供。在法律允许范围内，提供方不对间接、特殊或后果性损害承担责任；个人开发者除强制性法律禁止限制外不承担个人责任。编程练习按现状提供，不构成学历或就业承诺。未满 15 周岁的人只能在监护人同意并管理账户时使用。
      </p>
      <p>
        托管服务运行在 OVH，适用法国法。强制性消费者规则和 GDPR 不因此减损。联系 admin@luminaryworks.dev。版本 lw-legal-v2026-10-03。
      </p>
    </article>
  );
}

export function LegalPrivacyPage({ product }: { product: string }) {
  return (
    <article style={{ maxWidth: 720, margin: "32px auto", padding: "0 20px 64px", lineHeight: 1.65 }}>
      <p>
        <a href="/login">← 登录</a>
      </p>
      <h1>{product} 隐私政策</h1>
      <p>
        账号由 LuminaryWorks 统一身份处理。产品侧仅处理提供本服务所必需的会话与业务数据。详情见集团隐私政策。
      </p>
      <p>联系：admin@luminaryworks.dev</p>
    </article>
  );
}
