import Hero from '../../components/Hero';
import Features from '../../components/Features';
import TealSection from '../../components/TealSection';
import BottomBanner from '../../components/BottomBanner';

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      <Hero />
      <Features />
      <TealSection />
      <BottomBanner />
    </div>
  );
}
