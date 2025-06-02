import Hero from '@/components/hero'
import MovieGrid from '@/components/movie-grid'
import Navigation from '@/components/navigation'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <section>
          <h2 className="text-3xl font-bold mb-6">Movies</h2>
          <MovieGrid />
        </section>
      </div>
    </main>
  )
}
