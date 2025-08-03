import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { FeatureCards } from '@/components/FeatureCards'
import { DevelopmentTeam } from '@/components/DevelopmentTeam'
import { Footer } from '@/components/Footer'
import DemoModeBanner from '@/components/DemoModeBanner'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <DemoModeBanner />
      <Header />
      <HeroSection />
      <FeatureCards />
      <DevelopmentTeam />
      <Footer />
    </main>
  )
}



