import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Comparison } from "@/components/Comparison";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { Privacy } from "@/components/Privacy";
import { GetStarted } from "@/components/GetStarted";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Comparison />
        <HowItWorks />
        <Features />
        <Privacy />
        <GetStarted />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
