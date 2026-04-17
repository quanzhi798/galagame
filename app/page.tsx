import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { CharacterCard } from "@/components/character-card";
import { Footer } from "@/components/footer";
import { characters } from "@/lib/characters";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <Features />
      
      {/* Characters Preview Section */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              遇见<span className="gradient-text">神秘角色</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              每个角色都有自己的故事，等待你去发现
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.slice(0, 3).map((character, index) => (
              <CharacterCard key={character.id} character={character} index={index} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <a
              href="/characters"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-all"
            >
              查看全部角色
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
