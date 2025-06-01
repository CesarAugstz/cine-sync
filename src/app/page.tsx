import Hero from '@/components/hero'
import MovieGrid from '@/components/movie-grid'
import Navigation from '@/components/navigation'
import RoomManager from '@/components/room/room-manager'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <section>
              <h2 className="text-3xl font-bold mb-6">Movies</h2>
              <MovieGrid />
            </section>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <RoomManager />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
