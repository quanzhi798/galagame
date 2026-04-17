"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold gradient-text">谜境剧场</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              首页
            </Link>
            <Link href="/characters" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              角色
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              关于
            </Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            &copy; 2024 谜境剧场. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
