"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageCircle, User } from "lucide-react";
import type { Character } from "@/lib/characters";
import { cn } from "@/lib/utils";

interface CharacterCardProps {
  character: Character;
  index: number;
}

export function CharacterCard({ character, index }: CharacterCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/chat/${character.id}`}>
        <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 card-hover">
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(135deg, ${character.color}15 0%, transparent 60%)`,
            }}
          />

          {/* Content */}
          <div className="relative p-6">
            {/* Avatar */}
            <div className="relative mb-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-serif"
                style={{
                  background: `linear-gradient(135deg, ${character.color}30, ${character.color}10)`,
                  border: `2px solid ${character.color}40`,
                }}
              >
                <User className="w-8 h-8" style={{ color: character.color }} />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 flex items-center justify-center"
                style={{ borderColor: character.color }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: character.color }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {character.name}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${character.color}20`,
                    color: character.color,
                  }}
                >
                  {character.title}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {character.description}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {character.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Scenario */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">剧本背景</p>
              <p className="text-sm text-foreground mt-1">{character.scenario}</p>
            </div>

            {/* Chat Button */}
            <motion.div
              className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              style={{
                backgroundColor: `${character.color}15`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: character.color }} />
              <span className="text-sm font-medium" style={{ color: character.color }}>
                开始对话
              </span>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
