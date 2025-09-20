# 🤝 贡献指南

感谢您对音乐在线学习平台项目的关注！我们欢迎所有形式的贡献，无论是代码、文档、设计还是反馈建议。

## 📋 如何贡献

### 🐛 报告问题
如果您发现了 bug 或有改进建议：
1. 在 [GitHub Issues](https://github.com/your-username/music-theory-playground/issues) 中搜索是否已有相关问题
2. 如果没有，请创建新的 Issue
3. 请提供详细的描述，包括：
   - 问题的具体表现
   - 重现步骤
   - 期望的行为
   - 您的环境信息（浏览器版本、操作系统等）

### 💡 功能建议
对于新功能或改进建议：
1. 先在 [GitHub Discussions](https://github.com/your-username/music-theory-playground/discussions) 中讨论
2. 说明功能的用途和价值
3. 考虑实现的复杂度和维护成本
4. 等待社区反馈后再开始开发

### 🔧 代码贡献

#### 开发环境设置
```bash
# 克隆仓库
git clone https://github.com/your-username/music-theory-playground.git
cd music-theory-playground

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint
```

#### 代码规范
- 使用 TypeScript 进行开发
- 遵循 ESLint 配置的代码风格
- 使用 Tailwind CSS 进行样式开发
- 组件命名使用 PascalCase
- 文件命名使用 camelCase
- 常量使用 UPPER_SNAKE_CASE

#### 提交流程
1. Fork 本仓库到您的账户
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 进行开发并测试
4. 提交代码：`git commit -m "feat: 添加新功能描述"`
5. 推送分支：`git push origin feature/your-feature-name`
6. 创建 Pull Request

#### 提交信息规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构代码
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(rhythm): 添加十六分音符练习模式

- 新增十六分音符的可视化显示
- 实现更精确的节拍检测
- 优化用户反馈机制

Closes #123
```

## 🎯 开发优先级

### 高优先级
- 🐛 Bug 修复
- 🎵 音频引擎优化
- 📱 移动端适配
- ♿ 无障碍功能

### 中优先级
- 🎮 新的学习模块
- 🎨 UI/UX 改进
- 📊 数据分析功能
- 🌍 国际化支持

### 低优先级
- 🎪 高级功能
- 🎛️ 复杂编曲功能
- 🤖 AI 辅助功能

## 🧪 测试指南

### 手动测试
在提交 PR 前，请确保：
- [ ] 所有现有功能正常工作
- [ ] 新功能在不同浏览器中正常运行
- [ ] 移动端界面正常显示
- [ ] 音频功能在不同设备上正常工作
- [ ] 无控制台错误或警告

### 自动测试
```bash
# 运行所有检查
npm run lint
npm run type-check

# 构建测试
npm run build
```

## 📝 文档贡献

### 代码文档
- 为复杂函数添加 JSDoc 注释
- 为组件添加 props 类型说明
- 更新 README.md 中的功能描述

### 用户文档
- 更新用户指南
- 添加新功能的使用说明
- 完善 FAQ 部分

## 🎨 设计贡献

### UI/UX 改进
- 提供设计稿或原型
- 遵循现有的设计语言
- 考虑无障碍设计原则
- 确保移动端友好

### 视觉资源
- 图标使用 SVG 格式
- 图片优化压缩
- 保持风格一致性

## 🌟 认可贡献者

我们会在以下地方认可贡献者：
- README.md 的贡献者列表
- 发布说明中的感谢
- 项目官网的贡献者页面

## 📞 联系方式

如有任何疑问，可以通过以下方式联系：
- 创建 GitHub Issue
- 在 GitHub Discussions 中讨论
- 发送邮件至：[your-email@example.com]

## 📋 行为准则

### 我们的承诺
为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺：
- 尊重所有人，无论其经验水平、性别、性取向、残疾、个人外貌、体型、种族、民族、年龄、宗教或国籍
- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为
- 使用性化语言或图像，以及不受欢迎的性关注或性骚扰
- 恶意评论、人身攻击或政治攻击
- 公开或私人骚扰
- 发布他人的私人信息（如物理地址或电子邮件地址）而未获得明确许可
- 在专业环境中可能被合理认为不适当的其他行为

### 执行
项目维护者有权利和责任删除、编辑或拒绝不符合本行为准则的评论、提交、代码、wiki编辑、问题和其他贡献。

## 🎉 感谢

感谢您花时间为这个项目做出贡献！每一个贡献都让这个音乐学习平台变得更好。

---

*本文档基于 [Contributor Covenant](https://www.contributor-covenant.org/) 编写*
