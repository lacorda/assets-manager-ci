# assets-manager-cli

一个用于扫描项目图片资源、分析引用、生成报告，并支持安全删除未引用图片的命令行工具。


### 全局安装

```bash
npm i -g @lacorda/assets-manager-cli
assets-cli report
assets-cli delete --yes
```

## 命令说明

- `report`
  - 在目标目录生成 `assets-report.html`
  - 报告包含：路径、大小、是否被使用、图片预览；以及总体统计
  - 列表排序：已使用在前，未使用在后；未使用项文字为绿色

- `delete`
  - 删除判定为“未被引用”的图片
  - 默认交互确认，`--yes` 或 `-y` 跳过确认
  - 删除日志写入 `assets-delete.log`，格式：`ISO时间 相对路径`

## 参数

- `--dir <path>` 指定扫描目录，默认当前工作目录
- `--yes`/`-y` 删除时跳过确认
- `--ignore <glob[,glob]>` 额外忽略匹配规则（可重复使用该参数）

## 忽略目录

- 默认忽略：`node_modules`, `.git`, `dist`, `build`, `out`

## 生成内容

- 报告：`assets-report.html`（位于扫描根目录），预览 `img` 使用相对路径
- 删除日志：`assets-delete.log`（位于扫描根目录），按操作追加
 
### 报告样式

- 未使用图片的整行文字颜色为绿色（便于快速识别）

## 项目结构与入口

- 入口脚本：`bin/assets-manager.js`（bin 映射见 `package.json`）
- 参数解析与命令分发：`src/cli.js`
- 扫描与引用分析：`src/scan.js`
- 报告生成：`src/report.js`
- 删除与日志：`src/delete.js`

代码引用定位：

- `bin/assets-manager.js:1` 程序入口
- `src/cli.js:24` 命令解析与分发
- `src/scan.js:33` 目录扫描与引用分析
- `src/report.js:5` 生成 HTML 报告
- `src/delete.js:19` 删除未引用图片与日志写入

## 注意事项

- 删除操作不可撤销，建议先查看报告并做好备份
- 报告预览依赖相对路径，建议从项目根目录打开 `assets-report.html`

## 忽略文件（防止误判）

- 以下生成文件不参与引用匹配：
  - `assets-report.html`
  - `assets-delete.log`

这样可以避免先生成报告后，报告文件中的图片引用干扰删除判断，确保未使用图片可以被正确识别和删除。

## 尊重 .gitignore 忽略规则

- 扫描时会读取根目录下的 `.gitignore` 并按其规则忽略文件与目录（支持 `*`, `**`, `?`, 以 `/` 开头的锚定、以 `/` 结尾的目录规则、以及 `!` 反向规则）
- 建议将构建产物、临时文件等加入 `.gitignore`，可减少误判与提高扫描性能

### 临时忽略规则（命令行）

- 使用 `--ignore` 扩展忽略规则，与 `.gitignore` 合并生效：

  ```bash
  assets-cli report --ignore dist/**,**/*.tmp --ignore .cache/
  assets-cli delete --ignore images/generated/
  ```

- 支持逗号分隔或多次传入；支持 `!` 反向规则、`/` 锚定根、`/` 结尾表示目录规则

## 许可证

暂未指定

## 配置文件支持

- 可在项目根目录使用 `.assetsmanagerrc`（JSON）或 `package.json` 的 `assetsManager.ignore` 配置持久化忽略规则，和 `.gitignore`、命令行 `--ignore` 合并生效（后规则覆盖前规则）：

- 支持 YAML：`.assetsmanagerrc.yml` 或 `.assetsmanagerrc.yaml`
  - 示例：
  ```yaml
  ignore:
    - dist/**
    - **/*.tmp
    - images/generated/
  ```

  `.assetsmanagerrc`
  ```json
  {
    "ignore": ["dist/**", "**/*.tmp", "images/generated/"]
  }
  ```

  `package.json`
  ```json
  {
    "assetsManager": {
      "ignore": [".cache/", "public/vendor/"]
    }
  }
  ```

  说明：文件级忽略的优先顺序为 `.gitignore` -> 配置文件 -> 命令行参数，后者优先生效。

### 环境变量支持

- 可通过 `ASSETS_MANAGER_IGNORE` 以逗号分隔的形式临时设置忽略规则：
  ```bash
  ASSETS_MANAGER_IGNORE="dist/**,**/*.tmp,.cache/" assets-manager report
  ```
