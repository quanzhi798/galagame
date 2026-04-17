import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { characters } from "@/lib/characters";

interface ChatPageProps {
  params: Promise<{
    characterId: string;
  }>;
}

export async function generateStaticParams() {
  return characters.map((character) => ({
    characterId: character.id,
  }));
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { characterId } = await params;
  const character = characters.find((c) => c.id === characterId);
  
  if (!character) {
    return {
      title: "角色未找到 - 谜境剧场",
    };
  }
  
  return {
    title: `与${character.name}对话 - 谜境剧场`,
    description: character.description,
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { characterId } = await params;
  const character = characters.find((c) => c.id === characterId);
  
  if (!character) {
    notFound();
  }
  
  return <ChatInterface character={character} />;
}
