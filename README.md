# dsh-memory-lite

一个给 **DeepSeek Harness (DSH)** 用的最小跨会话记忆插件。

它只做两件事：

1. 提供 `remember` 工具，把一件事写进本地长期记忆。
2. 每次组装系统提示时，把最近/重要的记忆注入进去。

没有衰减、没有向量检索、没有设置页，也不依赖 DSH 的 `sessions` / `sessionTitle` / `llm` 服务。目标是**在 DSH 新版上先恢复“记得住”**，复杂能力以后再加。

## 兼容性

- 实测：DSH **0.2.1-rc.5**（Windows 桌面端）
- 只声明依赖 `systemPrompt`、`tools` 两个服务
- 不依赖 `fish-memory` 的数据或代码

> 这是精简替代品，不是 `fish-memory` 的完整复刻。两者不要同时启用：它们会各注册一个 `remember`，工具会冲突。

## 安装

### 从 Release 的 tgz 安装

在 DSH 的「设置 → 插件 → 安装」里填 tgz 的本地路径或 URL；或者用命令：

```bash
dsh plugin --profile desktop add "D:\path\to\dsh-memory-lite-0.1.0.tgz"
```

装完重启 DSH。

### 从 GitHub 源码安装

```bash
dsh plugin --profile desktop add "https://github.com/<your-name>/dsh-memory-lite"
```

装完重启 DSH。

## 使用

模型会看到一个 `remember` 工具：

```json
{
  "text": "ta喜欢三分糖加布丁的奶茶。",
  "key": "偏好.奶茶",
  "importance": 0.7
}
```

- `text`：必填，一条只写一件事。
- `key`：可选。会变化的事实用稳定键，例如 `账号.B站`、`约定.记忆规范`；同一个键只保留最新一条。
- `importance`：可选，0~1；约定/关系/核心状态用 0.8~1，普通事件 0.5。

写入后，下一次组装提示会自动带上一段 `【memory-lite 长期记忆】`。

## 数据

默认位置：

```text
%USERPROFILE%\.dsh\memory-lite\memories.json
```

- 纯文本 JSON，可以直接备份/查看
- 想清空就删掉这个文件（先备份）
- 插件包本身**不包含任何个人数据**

## 卸载

```bash
dsh plugin --profile desktop remove dsh-memory-lite
```

卸载不会删 `memories.json`；需要的话手动删除。

## 限制

- 记忆是**全局**的，所有会话共用一份；没有按工作区隔离。
- 没有自动淡忘、概率召回、向量检索、归档面板。
- 不会自动导入 `fish-memory` 的旧数据；需要单独迁移。
- 目前没有客户端 UI，只有工具和系统提示注入。

## 开发

```bash
pnpm install
pnpm pack
```

插件入口是 `lib/index.js`，只导出 `name`、`inject`、`apply`。

## License

MIT
