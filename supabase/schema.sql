-- TechFlow 博客数据库结构
-- 在 Supabase SQL Editor 中执行此文件

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 文章表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  read_time INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表（扩展 Supabase Auth）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 点赞表
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  avatar TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 阅读统计表
CREATE TABLE post_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 创建索引
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_post_reads_post_id ON post_reads(post_id);
CREATE INDEX idx_favorites_post_id ON favorites(post_id);

-- 创建 RLS 策略（Row Level Security）
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- 点赞策略
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- 评论策略
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 收藏策略
CREATE POLICY "Favorites are viewable by owner" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 阅读统计策略
CREATE POLICY "Users can insert reads" ON post_reads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own reads" ON post_reads FOR SELECT USING (auth.uid() = user_id);

-- 插入示例文章数据
INSERT INTO posts (id, title, excerpt, content, category, tags, read_time) VALUES
('1', 'GPT-5 架构猜想：从 Transformer 到世界模型', 'OpenAI 下一代大模型可能采用的架构突破...', '## 内容...', '模型架构', ARRAY['GPT-5', '架构', 'Transformer'], 10),
('2', 'RAG 2.0：从检索增强到知识图谱增强', '传统 RAG 面临的检索碎片化和上下文丢失问题...', '## 内容...', '应用实践', ARRAY['RAG', '知识图谱', '检索增强'], 12),
('3', '大模型微调实战：LoRA、QLoRA 与完全微调', '从理论到代码，全面对比三种主流微调方法...', '## 内容...', '模型训练', ARRAY['微调', 'LoRA', 'QLoRA', '训练'], 15),
('4', 'Prompt Engineering 进阶：Chain-of-Thought 到 Tree-of-Thought', '超越基础 prompt 技巧，探索高级推理框架...', '## 内容...', '应用实践', ARRAY['Prompt工程', '推理', 'CoT', 'ReAct'], 10),
('5', '大模型部署实战：vLLM、TGI 与推理优化', '从模型量化到 KV Cache 优化...', '## 内容...', '部署运维', ARRAY['部署', 'vLLM', '量化', '推理优化'], 14),
('6', '多模态大模型：从 GPT-4V 到 Gemini 的进化之路', '视觉、听觉、触觉——多模态大模型正在打破感知的边界...', '## 内容...', '模型架构', ARRAY['多模态', 'GPT-4V', 'Gemini', 'CLIP'], 11);
