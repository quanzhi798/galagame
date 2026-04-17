"use client";

import { motion } from "framer-motion";
import { Brain, MessageSquare, Fingerprint, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "智能对话",
    description: "基于先进 AI 技术，每个角色都有独特的性格、记忆和反应方式",
  },
  {
    icon: MessageSquare,
    title: "沉浸剧情",
    description: "精心设计的剧本背景，让你置身于民国风云的时代洪流中",
  },
  {
    icon: Fingerprint,
    title: "独特体验",
    description: "每次对话都是全新的探索，你的选择将影响故事的走向",
  },
  {
    icon: Zap,
    title: "实时响应",
    description: "流畅的对话体验，AI 角色会即时回应你的每一个问题",
  },
];

export function Features() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            为什么选择<span className="gradient-text">谜境剧场</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            我们将先进的 AI 技术与精心设计的剧本相结合，打造前所未有的沉浸式体验
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
