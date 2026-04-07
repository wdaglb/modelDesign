# 2026-04-08 登录滑动续期设计

## 背景
- 当前登录态由 JWT 和 Redis 会话共同构成：登录成功时后端签发一个带固定 `exp` 的 JWT，同时把 `CurrentAdmin` 写入 Redis。
- 鉴权拦截器在每次受保护请求通过后会刷新 Redis session 的 TTL，但不会同步签发新 JWT，因此 JWT 一旦到达初始过期时间，请求会在解析 JWT 阶段直接失败，Redis 续期逻辑失效。
- 前端目前只在登录成功时保存一次 token，后续请求全部复用原 token，也没有任何刷新或替换 token 的机制。

## 目标
- 保持现有“单 token + Redis session”模型，不引入 refresh token。
- 为受保护接口补齐真正的滑动窗口续期：用户持续活跃时，JWT 和 Redis session 都能同步向后延长。
- 不新增显式刷新接口，避免改动现有登录、登出与路由初始化流程。
- 控制改动范围在认证链路和请求封装层，并补齐前后端测试。

## 方案探索
1. **响应式续签（推荐）**
   - 后端在每次鉴权成功后判断 JWT 剩余有效期，低于续签阈值时重新签发一个新 token，并通过响应头回传给前端。
   - 前端在 axios 响应拦截器中读取响应头中的新 token，若其过期时间更晚则覆盖本地存储。
   - 优点是兼容现有接口和状态结构；缺点是要处理并发请求带来的覆盖顺序问题。推荐。
2. **双 token 模式**
   - 新增 refresh token、刷新接口和前端调度逻辑。
   - 优点是边界清晰；缺点是改动大，需要补充更多存储与失效策略，不符合当前“最小修复”目标。
3. **完全依赖 Redis session**
   - 取消或放宽 JWT 过期校验，只要 Redis 会话存在就视为有效。
   - 优点是实现最简单；缺点是 JWT 失去实际时效控制，认证模型倒退，不采用。

## 推荐方案细节

### 1. 后端续签规则
- 保持登录接口 `/passport/password_login` 返回初始 token 和 `expireTime` 的现有结构。
- 在 `AuthInterceptor` 鉴权成功后，继续保留 `sessionRepository.refresh(loginId)`，同时增加“是否需要续签”的判断。
- 续签判断基于当前 JWT 的剩余有效期：
  - 总有效期仍然取 `model-design.auth.token-expire-seconds`。
  - 新增续签阈值配置，建议命名为 `renewThresholdSeconds`，默认值取 `1800` 秒。
  - 当 `token.exp - now <= renewThresholdSeconds` 时，对当前 `CurrentAdmin` 重新签发一个新 JWT。
- 新 JWT 必须保留原 `loginId`、`tenantId`、`username`、`subject`，这样 Redis session key 和当前登录会话不变，只更新时间窗口。
- 新 token 通过响应头 `X-Renewed-Token` 返回，避免与请求头 `Authorization` 混用。
- 为了便于前端做覆盖判定，同时通过 `X-Renewed-Expire-Time` 返回新的过期时间戳（毫秒）。

### 2. 前端接收规则
- `admin-rsbuild/src/utils/request.ts` 的响应拦截器读取 `X-Renewed-Token` 和 `X-Renewed-Expire-Time`。
- 若响应头不存在这两个值，则保持现状，不更新本地登录态。
- 若响应头存在，则调用认证 store 的续签方法更新本地状态。
- 认证 store 需要新增 `tokenExpireTime` 状态，并在登录成功时一并写入 `localStorage`。
- 续签时必须比较新旧过期时间：
  - 只有当新的过期时间严格晚于当前记录时，才允许覆盖 token 和 `tokenExpireTime`。
  - 这样可以避免并发请求里“较早发出的请求晚返回”导致旧 token 覆盖新 token。

### 3. 兼容与异常处理
- 未登录、JWT 已过期、Redis session 不存在时，仍返回 401，不改变现有前端“弹窗提示并跳登录页”的行为。
- 非受保护接口不参与续签，避免给登录接口、公开接口增加额外响应头噪音。
- 前端不增加定时器、轮询或静默刷新逻辑，只有在真实业务请求成功时才接收续签结果，避免无请求状态下无限保活。
- 续签阈值只作为“何时重签”的控制，不改变最终 token 生命周期上限；每次成功续签后，新 JWT 从续签时刻重新计算完整有效期。

## 实施步骤
1. 扩展后端认证配置：
   - 在 `AuthProperties` 中新增 `renewThresholdSeconds`。
   - 在 `application.yaml` 中补充默认配置项。
2. 扩展 JWT 服务：
   - 提供读取 token 过期时间和判断是否接近过期的能力。
   - 提供基于现有 `CurrentAdmin` 生成新 token 与新过期时间的统一方法，避免拦截器自行组装。
3. 调整鉴权拦截器：
   - 在 JWT 校验通过、Redis session 命中后继续刷新 session TTL。
   - 若满足续签条件，则把新 token 和过期时间写入响应头。
4. 扩展前端认证 store：
   - 保存 `tokenExpireTime`。
   - 新增“仅在过期时间更晚时才覆盖”的续签方法。
5. 调整前端请求封装：
   - 登录成功时同时保存 `token` 与 `expireTime`。
   - 在响应拦截器读取续签响应头并调用 store 续签逻辑。
6. 补齐测试：
   - 后端补鉴权/续签单测。
   - 前端补 store 与 request 拦截器测试，覆盖并发覆盖保护。

## 验证方案
- 后端验证一：JWT 剩余时间大于阈值时，请求成功但响应头不包含续签信息。
- 后端验证二：JWT 剩余时间小于等于阈值时，请求成功，响应头返回 `X-Renewed-Token` 与 `X-Renewed-Expire-Time`，且两者对应新的完整有效期。
- 后端验证三：JWT 已过期时，请求直接 401，不会写入任何续签响应头。
- 前端验证一：登录成功时会同时保存 token 和 `expireTime`。
- 前端验证二：响应头带新 token 且过期时间更晚时，本地 token 被更新。
- 前端验证三：响应头带新 token 但过期时间不更晚时，本地 token 不更新。
- 前端验证四：401 响应仍沿用现有错误处理，不因新增续签逻辑改变跳转行为。

## 风险与限制
- 本方案默认前后端时间误差可接受；若部署环境存在明显时钟漂移，续签阈值需要适当保守。
- 响应头字段需保证网关、反向代理和开发环境不会剥离自定义头。
- 当前方案不处理“主动无操作保活”，因此长时间无请求的页面仍会自然过期，这符合滑动窗口语义。
