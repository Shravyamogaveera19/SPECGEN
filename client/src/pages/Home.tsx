import { HomeHero } from '../components/HomeHero';
import { FeaturesSlider } from '../components/FeaturesSlider';
import { HowItWorks } from '../components/HowItWorks';
import { HomeCTA } from '../components/HomeCTA';

export function Home() {
  return (
    <div className="w-full">
      <HomeHero />
      <FeaturesSlider />
      <HowItWorks />
      <HomeCTA />
    </div>
  );
} 