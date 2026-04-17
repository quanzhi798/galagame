"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Sparkles, Users, BookOpen, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <main>
      <Header />
      
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              关于<span className="gradient-text">谜境剧场</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              谜境剧场是一个创新的 AI 智能体剧本杀交互平台，将先进的人工智能技术与精心设计的剧本故事相结合，为用户提供沉浸式的对话体验。
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          >
            {[
              {
                icon: Sparkles,
                title: "我们的愿景",
                description: "让每个人都能体验到高质量的沉浸式剧本杀，打破时间和空间的限制，随时随地开启一场惊心动魄的推理之旅。",
              },
              {
                icon: Users,
                title: "智能角色",
                description: "每个 AI 角色都经过精心设计，拥有独特的性格、背景故事和对话风格，能够根据玩家的选择做出真实的反应。",
              },
              {
                icon: BookOpen,
                title: "精品剧本",
                description: "我们的剧本由专业编剧团队创作，涵盖民国悬疑、古风探案等多种题材，每一个故事都引人入胜。",
              },
              {
                icon: Zap,
                title: "技术驱动",
                description: "基于最先进的大语言模型技术，我们的 AI 能够理解上下文、保持角色一致性，并提供流畅自然的对话体验。",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">
              准备好开始你的冒险了吗？
            </h2>
            <p className="text-muted-foreground mb-6">
              选择一个角色，开始你的探索之旅
            </p>
            <a
              href="/characters"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 glow"
            >
              选择角色开始
            </a>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
