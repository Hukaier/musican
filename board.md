# 开发任务看板（EPIC → Story → Task）

说明：
- 优先级：P0（最高）/P1/ P2
- 预估：S（≤1天）/M（1-3天）/L（≥3天）
- 状态：Todo / Doing / Blocked / Review / Done

## EPIC A：音频与时序引擎（P0）
- 目标：提供稳定低抖动的时序、量化判定与多轨播放能力
- Story A1（P0, L, Todo）：建立 Tone.js Transport 与全局时钟
  - Task：初始化 Transport、BPM、拍号、循环段
  - Task：实现 click 轨与视觉播放头同步
- Story A2（P0, L, Todo）：节拍量化与点击判定
  - Task：实现最近拍/分拍量化函数
  - Task：提前调度（look-ahead）与延迟补偿
- Story A3（P1, M, Todo）：多音源（合成器/采样器）与混音通道
  - Task：鼓/贝斯/和弦/旋律四类默认音色链路
  - Task：音量、静音、Solo、总线与压限器

## EPIC B：题库与自适应（P1）
- 目标：支撑乐理练习与错题优先复现
- Story B1（P1, M, Todo）：题型引擎与渲染（选择/连线/拖拽/听辨/打击）
  - Task：题型 Schema 与判分接口
  - Task：UI 组件（题干、选项、反馈）
- Story B2（P1, M, Todo）：自适应与间隔重复（莱特纳）
  - Task：错题本与优先级队列
  - Task：学习路径权重调整

## EPIC C：模块化编曲工坊（P0）
- 目标：让用户通过 Loop + 智能生成 + 卷帘窗完成 8 小节作品
- Story C1（P0, M, Doing）：预制 Loop 系统与素材库
  - Task：Asset JSON（url/bpm/key/length/tags）与索引
  - Task：拖拽到时间轴、自动对齐与跨小节拼接
  - Task：工程 BPM/调性匹配与时间拉伸（限制在可接受范围）
- Story C2（P0, M, Todo）：智能和弦助手
  - Task：I–V–vi–IV 等进行库与风格映射
  - Task：和弦播放、转调、替代/转位建议
- Story C3（P0, L, Todo）：旋律生成器
  - Task：基于音阶/和弦内音的概率模型（马尔可夫链）
  - Task：再生成/变奏（位移/反向/增值/减值）
- Story C4（P0, L, Todo）：极简钢琴卷帘窗
  - Task：Canvas/SVG 卷帘窗与量化吸附
  - Task：铅笔/橡皮/选择工具，音符编辑（pitch/start/length/velocity）
- Story C5（P1, M, Todo）：可视化与反馈
  - Task：AnalyserNode 波形/频谱可视化
  - Task：播放头高亮、轨道配色与静音/独奏
- Story C6（P1, S, Todo）：模板与互动教程
  - Task：工程模板（8-Bit/抒情钢琴/Trap）文件与加载
  - Task：Intro.js 步步引导“首作”流程

## EPIC D：游戏化系统（P1）
- 目标：持续激励学习与创作
- Story D1（P1, S, Todo）：经验/等级与连击奖励
  - Task：任务与经验计算器
  - Task：连击日历与断签保护
- Story D2（P1, S, Todo）：徽章与称号
  - Task：成就触发条件（编曲新手/Loop 工匠/和声旅人/旋律炼金师）
  - Task：展示墙与分享卡片

## EPIC E：UI/UX 与可访问性（P1）
- Story E1（P1, M, Todo）：组件库与响应式布局
- Story E2（P1, S, Todo）：键盘可达性与 aria 支持

## EPIC F：基础设施与数据（P0）
- Story F1（P0, S, Todo）：鉴权与用户资料
- Story F2（P0, M, Todo）：进度/成绩/工程存储（Firestore 或 Postgres）
- Story F3（P1, S, Todo）：埋点与指标看板（留存/完成率/正确率）

## EPIC G：综合挑战（P2）
- Story G1（P2, S, Todo）：“编曲工坊首作”关卡判定与结算
- Story G2（P2, S, Todo）：分享导出（.wav）与作品卡片

---

近期冲刺（Sprint-1）建议范围（2 周）：
- C1 预制 Loop + 时间轴拖拽（核心）
- A1 全局时钟与播放头、A2 基础量化
- F1 鉴权 + F2 工程存储最小闭环
- D1 经验与连击（轻量）


