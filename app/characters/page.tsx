import { Header } from "@/components/header";
import { CharacterCard } from "@/components/character-card";
import { Footer } from "@/components/footer";
import { characters } from "@/lib/characters";

export default function CharactersPage() {
  return (
    <main>
      <Header />
      
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              选择你的<span className="gradient-text">对话角色</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              每个角色都有独特的背景故事和性格特点，选择一位开始你的探索之旅
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character, index) => (
              <CharacterCard key={character.id} character={character} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
