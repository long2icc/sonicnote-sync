# SonicNote Sync

[English](README.md)

将 [SonicNote 妙记](https://ainote.easylinkin.com)的录音、转录、AI 总结和学习报告同步到 Obsidian，以 Markdown 文件管理。每条录音对应一个文件，包含完整的元数据和内容。

## 功能

- **录音同步** — 一键拉取全部录音，自动生成 Markdown 文件
- **AI 转录** — 含说话人识别和时间戳的逐字转录
- **智能总结** — AI 自动生成的要点、行动项等总结内容
- **学习总结** — 知识全景图、核心收获、课后巩固（如有）
- **笔记同步** — 你在 App 中手写的笔记内容
- **自动同步** — 启动时自动同步 + 定时重同步（1/3/6/24 小时）
- **文件属性** — 可配置的 Frontmatter 元数据字段 + 自定义属性

## 前置要求

- Obsidian 桌面版 v0.15.0 及以上
- SonicNote 妙记账号

## 安装

### 手动安装

1. 从 [Release 页面](../../releases) 下载最新版本的 `sonicnote-sync-vX.X.X.zip`
2. 解压 zip 文件，得到 `main.js`、`manifest.json`、`styles.css` 三个文件
3. 打开 Obsidian Vault 所在文件夹，进入 `.obsidian/plugins/` 目录
4. 新建 `sonicnote-sync` 文件夹，将 3 个文件放进去：

```
.obsidian/plugins/sonicnote-sync/
├── main.js
├── manifest.json
└── styles.css
```

5. 重启 Obsidian，进入 **设置 → 第三方/社区插件**，找到 **SonicNote Sync** 并启用

## 使用方法

### 登录

1. 进入 **设置 → SonicNote Sync**
2. 点击「登录」按钮
3. 输入 API Key（在妙记 App → 我的 → API Key 管理中创建，格式：`sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

### 同步录音

登录成功后，通过以下任一方式触发同步：

- 点击左侧功能区的 **耳机图标**
- 命令面板（`Ctrl/Cmd + P`）输入 **"SonicNote: 同步录音"**

同步完成后，Vault 中会生成 `SonicNoteSync/` 文件夹，每条录音对应一个 Markdown 文件。

### 同步内容

每个录音文件包含：

| 内容 | 说明 |
|------|------|
| Frontmatter | 录音元数据（ID、时间、时长、设备名、标签等） |
| 笔记 | 你在 App 中手写的笔记内容 |
| AI 总结 | 智能总结内容（要点、行动项等） |
| 学习总结 | 知识全景图、核心收获、课后巩固（如有） |
| 转录内容 | AI 转写文本（含说话人、时间戳） |

## 设置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| 同步文件夹 | `SonicNoteSync` | Markdown 文件存放目录 |
| 包含转录内容 | 开启 | 关闭后同步文件中不包含逐字转录 |
| 启动时自动同步 | 关闭 | 打开 Obsidian 时自动执行一次同步 |
| 定时重同步 | 关闭 | 1/3/6/24 小时间隔自动重新同步 |
| 文件属性 | 全部开启 | 按需开关 Frontmatter 中的内置属性字段 |
| 自定义属性 | 无 | 添加自定义键值对到所有同步文件 |

## 同步规则

- 已同步的录音默认不会被覆盖更新
- 如果录音总结完成后标题发生变化，下次同步会自动更新内容并重命名文件
- 删除本地文件后重新同步即可重新获取最新内容

## 更新

下载新版本 zip 文件，解压覆盖 `.obsidian/plugins/sonicnote-sync/` 下的 3 个文件，重启 Obsidian 即可。

## 卸载

1. 进入 **设置 → 社区插件**，找到 SonicNote Sync，点击禁用并卸载
2. 手动删除 `.obsidian/plugins/sonicnote-sync/` 文件夹

## 开发

```bash
npm install
npm run dev     # 开发模式（监听文件变化）
npm run build   # 编译打包
```

## 许可证

[MIT](LICENSE)
