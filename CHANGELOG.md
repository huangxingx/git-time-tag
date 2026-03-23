# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-23

### Added
- 帮助命令 (`-h`, `--help`)，显示详细的使用说明和配置示例
- 自定义后缀功能，支持用户输入任意后缀
- 无后缀模式 (`None` 选项)，创建不带后缀的标签
- 配置保存功能，可将自定义后缀保存到本地或全局配置
- 分支合并检测，自动识别分支是否已合并到 main/master/develop
- 标签位置选择，支持在源分支或目标分支（使用合并提交）上创建标签
- 远程分支时间信息显示，在选择分支时显示最后更新时间
- 命令行选项 `-b/--branch` 指定远程分支
- 命令行选项 `-m/--message` 添加标签消息

### Changed
- 更新版本号至 1.1.0
- 完善 README.md 和 README_zh.md 文档
- 更新 docs/index.html 介绍页面，新增 8 个功能卡片

### Fixed
- 完善错误处理和用户提示

---

## [1.0.0] - 2026-03-20

### Added
- 项目文档网站 (docs/index.html)
- Node.js CI 工作流 (GitHub Actions)

### Changed
- 包名更新为 `@joemuhuang/gtt`
- 开源协议变更为 MIT

---

## [1.0.0-beta] - 2026-03-19

### Added
- 远程分支选择功能
- 分支合并支持
- HTTPS 克隆 URL 支持

### Fixed
- 修正 getRemoteBranches 使用 branch() API

---

## [0.1.0] - 2026-03-14

### Added
- 标签消息/注释支持（annotated tags）
- 中文 README 文档
- 可配置的后缀选项

### Changed
- 项目重命名为 git-timetag
- 改进 README 文档

---

## [0.0.1] - 2026-03-07

### Added
- 初始版本发布
- 基于时间戳的 Git 标签生成
- 交互式命令行界面
- 配置文件支持 (.gitimetagrc)
- 自定义标签格式和日期格式
