import type { Post, Category } from '../types'

export const posts: Post[] = [
  {
    id: '1',
    title: 'GPT-5 架构猜想：从 Transformer 到世界模型',
    excerpt: 'OpenAI 下一代大模型可能采用的架构突破。从稀疏混合专家到多模态原生融合，探讨大模型从语言模型迈向世界模型的技术路径。',
    authorId: 'user_1',
    authorName: '张明远',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmy',
    content: `## 从语言模型到世界模型

当前的大语言模型本质上是"下一个 token 预测器"，而真正的智能需要对物理世界建立深层理解。GPT-5 可能标志着这一转变的开始。

### 稀疏混合专家架构（MoE）

MoE 让模型在保持巨大参数量的同时，每次推理只激活一小部分参数：

\`\`\`python
class MoELayer(nn.Module):
    def __init__(self, num_experts=8, top_k=2):
        self.experts = nn.ModuleList([
            FeedForward() for _ in range(num_experts)
        ])
        self.gate = nn.Linear(d_model, num_experts)

    def forward(self, x):
        weights = F.softmax(self.gate(x), dim=-1)
        top_k_weights, top_k_idx = weights.topk(self.git_k)
        # 只激活 top-k 个专家
        output = sum(w * self.experts[i](x)
                     for w, i in zip(top_k_weights, top_k_idx))
        return output
\`\`\`

### 多模态原生融合

GPT-5 可能不再是"先看图再说话"，而是在同一空间中同时处理文本、图像、音频和视频。

### 长期记忆与推理链

通过引入持久记忆机制和显式推理链，模型可以：
- 记住数月前的对话上下文
- 执行需要多步推理的复杂任务
- 在推理过程中动态检索外部知识

## 训练范式的变革

### 合成数据与自我博弈

模型生成训练数据，再用自己的判别能力筛选，形成自我提升循环。

### RLHF 3.0

从人类偏好反馈进化到环境反馈——模型在模拟环境中行动，根据结果自我优化。`,
    date: '2026-06-12',
    tags: ['GPT-5', '架构', 'Transformer'],
    category: '模型架构',
    readTime: 10,
    pinned: true,
    viewCount: 1280,
  },
  {
    id: '2',
    title: 'RAG 2.0：从检索增强到知识图谱增强',
    excerpt: '传统 RAG 面临的检索碎片化和上下文丢失问题正在被新一代方案解决。知识图谱增强、图检索和混合检索策略正在重新定义 RAG。',
    authorId: 'user_2',
    authorName: '李思琪',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lsq',
    content: `## 传统 RAG 的瓶颈

检索增强生成（RAG）已成为大模型应用的标准范式，但传统 RAG 存在严重问题：

- **检索碎片化**：向量检索只捕获语义相似度，丢失文档结构
- **上下文窗口浪费**：检索到的片段可能包含大量无关信息
- **多跳推理失败**：需要串联多个文档才能回答的问题，RAG 往往只检索到一部分

## RAG 2.0 的三大突破

### 1. 知识图谱增强 RAG（GraphRAG）

\`\`\`
查询 → 实体识别 → 子图检索 → 路径排序 → 上下文构建 → LLM 生成

传统: [chunk1, chunk2, chunk3] → LLM
GraphRAG: [entity_A] --rel1--> [entity_B] --rel2--> [entity_C] → LLM
\`\`\`

### 2. 混合检索策略

\`\`\`python
def hybrid_search(query, alpha=0.7):
    # 向量检索：捕获语义相似性
    vector_results = vector_db.search(embed(query), top_k=20)

    # 关键词检索：捕获精确匹配
    bm25_results = bm25_index.search(query, top_k=20)

    # 融合排序
    fused = reciprocal_rank_fusion(
        vector_results, bm25_results, alpha=alpha
    )
    return fused[:10]
\`\`\`

### 3. 自适应检索

模型自己决定何时检索、检索什么、检索多少：

\`\`\`
问题分析 → 需要外部知识？→ [是] → 检索策略选择 → 执行检索 → 答案生成
                    ↓
                   [否] → 直接生成
\`\`\`

## 实战案例：企业知识库

某企业部署 GraphRAG 后：
- 问答准确率从 62% 提升到 89%
- 多跳推理问题解决率从 23% 提升到 71%
- 平均响应时间减少 40%（更少的无效检索）`,
    date: '2026-06-08',
    tags: ['RAG', '知识图谱', '检索增强'],
    category: '应用实践',
    readTime: 12,
    viewCount: 856,
  },
  {
    id: '3',
    title: '大模型微调实战：LoRA、QLoRA 与完全微调',
    excerpt: '从理论到代码，全面对比三种主流微调方法。附完整训练脚本和超参数调优指南。',
    authorId: 'user_3',
    authorName: '王浩然',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=whr',
    content: `## 为什么需要微调

通用大模型虽然强大，但在特定领域的表现往往不如专用模型。微调让模型"专精"于你的任务。

### 微调方法对比

| 方法 | 显存需求 | 训练速度 | 效果 | 适用场景 |
|------|---------|---------|------|---------|
| 完全微调 | 极高 | 慢 | 最佳 | 数据充足、算力充足 |
| LoRA | 中等 | 快 | 良好 | 大多数场景 |
| QLoRA | 低 | 中 | 良好 | 消费级 GPU |

## LoRA 详解

Low-Rank Adaptation 的核心思想：大模型的权重更新是低秩的。

\`\`\`python
class LoRALinear(nn.Module):
    def __init__(self, original_linear, rank=16, alpha=32):
        self.original = original_linear
        self.original.requires_grad_(False)  # 冻结原权重

        d_in = original_linear.in_features
        d_out = original_linear.out_features

        # 低秩矩阵分解
        self.lora_A = nn.Parameter(torch.randn(d_in, rank))
        self.lora_B = nn.Parameter(torch.zeros(rank, d_out))
        self.scaling = alpha / rank

    def forward(self, x):
        # 原始输出 + LoRA 增量
        original_out = self.original(x)
        lora_out = (x @ self.lora_A @ self.lora_B) * self.scaling
        return original_out + lora_out
\`\`\`

### 关键超参数

\`\`\`python
training_args = {
    "rank": 16,           # 低秩维度，越大效果越好但显存越多
    "alpha": 32,          # 缩放因子，通常设为 rank 的 2 倍
    "dropout": 0.05,      # LoRA 层的 dropout
    "target_modules": [   # 应用 LoRA 的层
        "q_proj", "v_proj", "k_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    "lr": 2e-4,           # 学习率
    "epochs": 3,          # 训练轮数
    "batch_size": 4,      # 批次大小
    "gradient_accumulation": 8,  # 梯度累积
}
\`\`\`

## QLoRA：4-bit 量化下的 LoRA

QLoRA 在 LoRA 基础上加入 4-bit 量化，让 70B 模型在 24GB 显存上微调。

\`\`\`python
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-70B",
    quantization_config=bnb_config,
    device_map="auto",
)
\`\`\``,
    date: '2026-06-05',
    tags: ['微调', 'LoRA', 'QLoRA', '训练'],
    category: '模型训练',
    readTime: 15,
    viewCount: 634,
  },
  {
    id: '4',
    title: 'Prompt Engineering 进阶：Chain-of-Thought 到 Tree-of-Thought',
    excerpt: '超越基础 prompt 技巧，探索高级推理框架。CoT、ToT、ReAct 和自我反思如何让大模型解决复杂问题。',
    authorId: 'user_1',
    authorName: '张明远',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmy',
    content: `## 推理框架的演进

\`\`\`
Zero-shot → Few-shot → Chain-of-Thought → Tree-of-Thought → ReAct
\`\`\`

## Chain-of-Thought（思维链）

让模型"展示推理过程"，而非直接给出答案。

\`\`\`
[Zero-shot]
Q: 一个球拍和一个球共1.1美元，球拍比球贵1美元，球多少钱？
A: 0.05美元

[Chain-of-Thought]
Q: ...
A: 让我一步步思考：
   1. 设球的价格为 x
   2. 球拍价格为 x + 1.0
   3. x + (x + 1.0) = 1.1
   4. 2x = 0.1
   5. x = 0.05
   球的价格是 0.05 美元
\`\`\`

## Tree-of-Thought（思维树）

多条推理路径并行探索，动态评估和剪枝：

\`\`\`
                    [问题]
                   /  |  \
              [思路A] [思路B] [思路C]
              /   \      |      \
          [A1]  [A2]   [B1]    [C1]
          ↓      ↓      ↓       ↓
        评估   评估    评估    评估
        0.8    0.3    0.6     0.9
        ↑                    继续展开
\`\`\`

## ReAct：推理 + 行动

模型交替进行"思考"和"行动"：

\`\`\`
Thought: 我需要查找2024年GDP数据
Action: search("2024年中国GDP")
Observation: 2024年中国GDP为126万亿元

Thought: 现在需要计算增长率
Action: calculate(126 / 120.5 - 1)
Observation: 4.56%

Thought: 我有了所有信息，可以回答了
Answer: 2024年中国GDP为126万亿元，同比增长4.56%
\`\`\`

## 自我反思（Self-Reflection）

\`\`\`
初始答案 → 检查逻辑 → 发现矛盾 → 重新推理 → 修正答案
                                    ↑
                              [反思触发点]
\`\`\``,
    date: '2026-06-01',
    tags: ['Prompt工程', '推理', 'CoT', 'ReAct'],
    category: '应用实践',
    readTime: 10,
    viewCount: 423,
  },
  {
    id: '5',
    title: '大模型部署实战：vLLM、TGI 与推理优化',
    excerpt: '从模型量化到 KV Cache 优化，全面解析生产环境下的大模型部署方案。附性能基准测试对比。',
    authorId: 'user_2',
    authorName: '李思琪',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lsq',
    content: `## 部署方案对比

| 方案 | 吞吐量 | 延迟 | 易用性 | 特点 |
|------|--------|------|--------|------|
| vLLM | ★★★★★ | ★★★★ | ★★★★ | PagedAttention，高并发 |
| TGI | ★★★★ | ★★★★★ | ★★★★★ | HuggingFace 生态 |
| Ollama | ★★★ | ★★★ | ★★★★★ | 本地部署首选 |
| TensorRT-LLM | ★★★★★ | ★★★★★ | ★★ | NVIDIA 优化极致 |

## vLLM：PagedAttention 的革命

vLLM 的核心创新是 PagedAttention，将 KV Cache 管理从连续内存改为分页管理：

\`\`\`python
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-3-8B-Instruct",
    tensor_parallel_size=1,  # GPU 数量
    max_model_len=8192,
    gpu_memory_utilization=0.9,
)

sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=2048,
)

outputs = llm.generate([
    "解释什么是 Transformer 架构",
    "用 Python 写一个快速排序",
], sampling_params)
\`\`\`

### 为什么 PagedAttention 更快

\`\`\`
传统方式：预分配最大长度的连续内存 → 浪费 60%+ 显存
PagedAttention：按需分配内存块 → 显存利用率接近 100%
\`\`\`

## 量化：用精度换速度

### GPTQ 量化

\`\`\`python
from transformers import AutoModelForCausalLM, GPTQConfig

quantization_config = GPTQConfig(
    bits=4,
    group_size=128,
    desc_act=True,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    quantization_config=quantization_config,
)
\`\`\`

### GGUF 量化（Ollama 使用）

\`\`\`bash
# 量化模型
./llama-quantize ./models/llama3-f16.gguf \
    ./models/llama3-q4_k_m.gguf Q4_K_M

# 运行
ollama run llama3:8b-q4_K_M
\`\`\`

## KV Cache 优化

### MQA / GQA

\`\`\`
标准 Attention: 每个头独立的 KV → 显存占用大
Multi-Query: 所有头共享一组 KV → 显存减少 h 倍
Grouped-Query: h/g 个头共享 KV → 平衡效率和质量
\`\`\`

## 性能基准

\`\`\`
测试环境: A100 80GB, Llama-3-70B-Instruct
并发数: 16

vLLM (FP16):       吞吐 420 tokens/s, 延迟 85ms
vLLM (AWQ):        吞吐 680 tokens/s, 延迟 52ms
TGI (FP16):        吞吐 380 tokens/s, 延迟 92ms
TGI (GPTQ):        吞吐 580 tokens/s, 延迟 61ms
TensorRT-LLM:      吞吐 750 tokens/s, 延迟 45ms
\`\`\``,
    date: '2026-05-28',
    tags: ['部署', 'vLLM', '量化', '推理优化'],
    category: '部署运维',
    readTime: 14,
    viewCount: 512,
  },
  {
    id: '6',
    title: '多模态大模型：从 GPT-4V 到 Gemini 的进化之路',
    excerpt: '视觉、听觉、触觉——多模态大模型正在打破感知的边界。深入解析 CLIP、Flamingo 和 Gemini 的架构创新。',
    authorId: 'user_3',
    authorName: '王浩然',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=whr',
    content: `## 多模态架构演进

\`\`\`
单模态 → 视觉-语言对齐 → 原生多模态 → 任意模态融合

CLIP (2021) → Flamingo (2022) → GPT-4V (2023) → Gemini (2024) → GPT-5 (2025?)
\`\`\`

## CLIP：视觉-语言对齐的基石

CLIP 学习图像和文本的共享表示空间：

\`\`\`python
class CLIP(nn.Module):
    def __init__(self):
        self.image_encoder = ViT()      # 图像编码器
        self.text_encoder = Transformer() # 文本编码器
        self.temperature = nn.Parameter(torch.ones([]))

    def forward(self, images, texts):
        # 分别编码
        image_features = self.image_encoder(images)
        text_features = self.text_encoder(texts)

        # 归一化
        image_features = F.normalize(image_features, dim=-1)
        text_features = F.normalize(text_features, dim=-1)

        # 计算相似度矩阵
        logits = image_features @ text_features.T / self.temperature
        return logits
\`\`\`

## GPT-4V 的架构推测

### 视觉编码器

\`\`\`
图像 → ViT-L/14 → 576 个视觉 token → MLP 投影 → LLM token 空间
\`\`\`

### 动态分辨率处理

\`\`\`python
def dynamic_resolution(image, max_tiles=12):
    # 根据图像大小动态选择切片数量
    width, height = image.size
    aspect_ratio = width / height

    if aspect_ratio > 1.5:
        tiles = (4, 2)  # 宽图
    elif aspect_ratio < 0.67:
        tiles = (2, 4)  # 高图
    else:
        tiles = (3, 3)  # 方图

    return split_into_tiles(image, tiles)
\`\`\`

## Gemini：原生多模态

Gemini 的关键创新：从训练开始就同时处理所有模态。

\`\`\`
文本 token  ──┐
图像 token  ──┼──→ 统一 Transformer ──→ 输出
音频 token  ──┤
视频 token  ──┘
\`\`\`

### 视频理解

Gemini 可以直接处理长达数小时的视频，通过均匀采样帧来理解时间维度。

## 多模态应用前沿

### 文档理解

\`\`\`
发票图片 → OCR + 布局分析 → 结构化数据 → 自动录入
\`\`\`

### 医疗影像

\`\`\`
X 光片 → 多模态模型 → 诊断建议 + 解释
\`\`\`

### 自动驾驶

\`\`\`
摄像头视频 + 激光雷达 → 场景理解 → 决策规划
\`\`\``,
    date: '2026-05-20',
    tags: ['多模态', 'GPT-4V', 'Gemini', 'CLIP'],
    category: '模型架构',
    readTime: 11,
    viewCount: 789,
  },
]

export const categories: Category[] = [
  { name: '全部', count: posts.length, icon: '◈' },
  { name: '模型架构', count: posts.filter(p => p.category === '模型架构').length, icon: '◇' },
  { name: '模型训练', count: posts.filter(p => p.category === '模型训练').length, icon: '◆' },
  { name: '应用实践', count: posts.filter(p => p.category === '应用实践').length, icon: '⬡' },
  { name: '部署运维', count: posts.filter(p => p.category === '部署运维').length, icon: '⬢' },
]

export const allTags = [...new Set(posts.flatMap(p => p.tags))]
