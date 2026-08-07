# 技术设计文档 — MiniTab Web V2

## 1. 技术栈

| 层面 | 选型 | 说明 |
| --- | --- | --- |
| 语言 | TypeScript 5.x | 严格模式 |
| 框架 | React 18.x | 函数组件 + Hooks |
| 构建 | Vite 6.x | dev HMR + 生产构建 |
| 状态 | Zustand 4.x + persist | 数据持久化与撤销历史 |
| 样式 | Tailwind CSS 3.x | 工具类优先 |
| 图表 | ECharts 5.x core | 按需注册，分析页懒加载 |
| 虚拟化 | @tanstack/react-virtual | 行列窗口化 |
| 测试 | Vitest + Playwright | 单元 + E2E |
| 包管理 | pnpm | 固定 lockfile |

## 2. 项目结构

```
v2/
  docs/
  e2e/
  src/
    analysis/        # 分析注册表、懒加载组件表
    components/      # layout / spreadsheet / analysis / common
    hooks/           # 选区 hook
    i18n/zh.ts       # 集中文案
    stats/           # 纯函数统计模块
    store/           # Zustand stores
    types/
    utils/
```

## 3. 状态设计

### 3.1 tableStore

- `tables`、`tableOrder`、`activeTableId` 持久化。
- `history`、`future` 保存编辑前后快照，支持撤销/重做。
- `setCellValue/setCellValues/setSubHeader/ensureSize` 等变更统一记录历史。
- `getColumnData`、`getColumnPairs` 提供分析所需数据，缺失值按行配对。

### 3.2 analysisStore

- `results`、`resultByTable`、`openTabs`、`activeTabId` 持久化。
- `clearResultsForTable` 级联清理结果、结果标签和表自身标签。

## 4. 分析注册与懒加载

`src/analysis/registry.ts` 保存每个分析的标签、图标、默认配置和 run 逻辑；Ribbon 只依赖该元数据。

`src/analysis/analysisComponents.ts` 使用 `React.lazy` 映射类型到组件，Workspace 渲染时才加载分析代码。ECharts 通过 `echarts/core` 注册 Bar/Line/Scatter/Boxplot 图表和必要组件，首屏不包含图表库。

点击 Ribbon 时：

1. `createAnalysis` 读取默认列（第一个或前两个有数据的列）。
2. `definition.run` 同步计算结果。
3. `addResult` 写入结果、打开标签并激活。

## 5. 统计实现

- Shapiro-Wilk：Royston AS R94，系数与 Horner 多项式参照 R `swilk.c`，正态分位数使用 AS241 完整比值实现。
- Anderson-Darling：标准 AD 统计量及近似 P 值。
- KS：统计量使用估计均值/标准差，P 值采用 Lilliefors（Dallal-Wilkinson 近似，p>0.1 回退双尾 KS 和）。
- 锚点测试与 SciPy 参考值对齐。

## 6. 部署

Netlify 为唯一部署目标：

```toml
[build]
  base = "v2"
  command = "pnpm build"
  publish = "dist"
```

## 7. 质量门禁

CI 在固定 lockfile 后依次执行：

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## 8. 版本记录

| 版本 | 日期 | 内容 |
| --- | --- | --- |
| v1 | 2026-07-26 | 初始功能 |
| v2 | 2026-08-01 | 统计修正、能力分析拆分、虚拟化、撤销/重做、持久化、懒加载、CI/Netlify |
