# GitHub + Release 发布步骤

这个目录已经是可发布的插件源码。发布前只需要把占位符 `Moli00115216` 换掉。

## 1. 建仓库

在 GitHub 新建一个空仓库，名字建议：

```text
dsh-memory-lite
```

不要勾选自动生成 README/License，保持空仓库。

## 2. 推源码

```bash
git init
git add .
git commit -m "dsh-memory-lite 0.1.0"
git branch -M main
git remote add origin https://github.com/Moli00115216/dsh-memory-lite.git
git push -u origin main
```

## 3. 打 Release 包

```bash
pnpm pack --pack-destination ./release
```

会得到：

```text
release/dsh-memory-lite-0.1.0.tgz
```

检查包里不能有 `memories.json`、`.dsh`、token 或日志：

```bash
tar -tzf release/dsh-memory-lite-0.1.0.tgz
```

## 4. 发 Release

在 GitHub 仓库 → Releases → Draft a new release：

- Tag：`v0.1.0`
- Title：`dsh-memory-lite 0.1.0`
- 附件：`release/dsh-memory-lite-0.1.0.tgz`

Release 说明里写：

```text
Minimal cross-session memory for DSH 0.2.1-rc.5.
Provides a `remember` tool and prompt injection; local JSON only.
Do not enable together with fish-memory.
```

## 5. 别人怎么装

从 Release 下载 tgz 后：

```bash
dsh plugin --profile desktop add "D:\path\to\dsh-memory-lite-0.1.0.tgz"
```

或在 DSH 设置 → 插件 → 安装里粘贴 tgz 路径/URL，然后重启。

## 6. 发布前检查

- [ ] `package.json` 里 `private` 已移除
- [ ] `README.md` 的 `Moli00115216` 已替换
- [ ] `LICENSE` 保留
- [ ] `tar -tzf` 里没有个人数据
- [ ] 在干净 DSH profile 里装过一次并能调用 `remember`
