# 周公子纸巾基金会 · FUND NO.001

办公室卫生间不供纸 → 自愿捐纸 → 电商下单 → 小票上墙 → 大家安心扯纸。
**自愿捐献、不搞摊派**：捐不捐全凭心意，没捐的人照样用纸。收款走**支付宝小荷包**（自带流水，和网站账本互为对账），主理人收到后统一买纸并公示。一个**零后端**的静态页面，账本就是一个 JS 文件。

- 线上地址：**https://metbix.com/**（Cloudflare Pages）
- 主理人：**jack-liang**（[jack-liang.com](https://jack-liang.com)）
- 本地预览：文件夹里起任意静态服务器（如 `npx http-server -p 8341 -c-1`）

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 主页面（手机优先，扫码落地页） |
| `ledger.js` | **账本，唯一要编辑的文件** |
| `app.js` | 页面渲染逻辑（不用动） |
| `styles.css` / `tokens.css` | 样式与设计令牌（不用动） |
| `poster.html` | 贴卫生间的 A4 海报（浏览器打印） |
| `assets/qr-site.*` | 指向 https://metbix.com/ 的二维码（已生成） |
| `assets/qr-xiaohebao-demo.png` | 小荷包**示意码**（入仓库、上公网的就是它） |
| `assets/qr-xiaohebao.png` | 小荷包**真码**——已 gitignore，**永不进仓库/公网**，本地放真码用于打印海报 |
| `generate-qr.js` | 二维码生成脚本（换网址时用） |
| `proof/`（自建） | 放电商订单截图，路径填进 `ledger.js` 的 `proof` 字段 |

## 部署（Cloudflare Workers · 静态资产）

配置已就绪（`wrangler.jsonc`），仓库根就是站点根，纯静态无需构建：

```bash
npx wrangler login     # 首次：浏览器授权登录 Cloudflare（只需一次）
npx wrangler deploy    # 部署：上传资产并绑定 metbix.com
```

- 本地预览：`npx wrangler dev`（前台运行，Ctrl+C 干净退出）
- **自定义域**：配置里已绑定 `metbix.com`（custom_domain）。前提是 metbix.com 的 DNS 托管在同一个 Cloudflare 账户；如果 deploy 报 zone 错误，删掉 `wrangler.jsonc` 里的 `routes` 字段先部署到 `*.workers.dev`，再到控制台 Workers & Pages → 本项目 → Settings → Domains & Routes 手动绑定。
- 非站点文件（`node_modules`、`README.md`、脚本等）已通过 `.assetsignore` 排除，不会上传。

日常更新：改 `ledger.js` 记账 → `git push`（GitHub 关联自动部署）或再跑一次 `npx wrangler deploy`。

> 注意：订单截图命名用英文/数字（`proof/jd-0926.jpg`），避开中文文件名兼容问题。

## 配置小荷包（上线前必做）

1. 支付宝 App 搜索「**小荷包**」→ 创建一个（名称如「周公子纸巾基金会」）。
2. 创建后做一次**安全自查**（重要，见下方隐私章节）。
3. 生成邀请二维码，保存为 `assets/qr-xiaohebao.png`（本地文件，已被 gitignore，**只用于打印海报**）。
4. 打印 `poster.html` → 真码就贴在卫生间。网页上不放码，只写指引（「去卫生间扫海报」），真码不进仓库、不上公网。

## 隐私保护（本项目的三条铁律）

1. **账本匿名靠约定**：页面上显示的称呼就是 `ledger.js` 里的 `name`——写「某某某」或「匿名」即匿名，写真名/花名即上榜。主理人记账时照转账备注替捐款人把关，别把真名写上去。
2. **邀请码不上公网**：小荷包邀请链接 = 入群券，泄露则陌生人可加入看流水、往里存钱。所以**网页上不放码**（只指引大家去扫卫生间海报），真码文件也被部署排除清单挡在公网之外；仓库里只有海报回退用的示意码。**链接本身也不要发到任何聊天群之外的渠道。**
3. **小荷包安全自查**（创建后立刻确认）：
   - 转出/取出权限：仅主理人（管理员）可操作——这是资金安全的底线；
   - 若支持「加入需管理员同意」，开启它，泄露的链接就废了一半；
   - 建议同事把支付宝昵称改成花名，小荷包流水成员可见，别暴露真名。

## 记账流程（主理人每周 5 分钟）

1. 小荷包有进账 → 在 `ledger.js` 的 `entries` 末尾加一条 `{ kind: "in", date, name, amount, note }`。`name` 就是页面上显示的称呼：照转账备注写，备注匿名就写「某某某」。
2. 攒够一提的价钱 → 电商下单买纸，加一条 `{ kind: "out", ... }`：
   - `link`：贴**商品页链接或订单分享出来的链接**，手机上点开直接唤起京东/淘宝 App。
     京东：`item.jd.com/…` 或订单详情「分享」出的链接；淘宝/天猫：`item.taobao.com` / `detail.tmall.com` 链接。淘口令没法当链接用，贴商品页即可。
   - `proof`：订单截图放 `proof/` 文件夹，填 `"proof/jd-0926.jpg"`。链接和截图双保险，谁都能查。
3. 数一眼库存，更新 `stockRolls`。

正式启用：把 `demo` 改为 `false`，示例提示条自动消失（示例流水请删除或替换成真账）。

## 账务原则（页面里也写了）

1. **自愿捐献**——不摊派、不众筹，捐是心意，不捐照样用纸。
2. **主理人负责**——主理人收到每一笔后统一买纸并公示；小荷包流水 + 网站账本 + 订单截图，三处留痕互相咬合。
3. **只买纸**——专款专用，无拓展品类计划；订单链接直达京东/淘宝 App。
4. **全员可查**——账本每周更新，结余精确到分，拿账本对，别拿感觉对。

## 备注

- **字体**：页面用 Google Fonts（Plus Jakarta Sans + JetBrains Mono），国内加载失败时自动退回系统字体（苹方/微软雅黑），不影响使用。
- **二维码**：`assets/qr-site.svg/png` 已指向 https://metbix.com/ 。以后换域名，运行 `node generate-qr.js 新网址` 重新生成，海报重新打印。
- **合规**：办公室同事内部自愿凑份子，金额小、人群熟。对外传播避免「募捐/慈善/众筹」字样；小荷包邀请码只贴办公室，别发到公共互联网上（防止陌生人扫码入群）。
- **设计**：Hallmark · Stat-Led 宏结构 · Hum 主题（playful 流派）。
