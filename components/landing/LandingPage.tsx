"use client";

import { useRef, useState } from "react";
import LandingHeader from "./LandingHeader";
import BurgerMenu from "./BurgerMenu";
import MapModal from "./MapModal";
import Preloader from "./Preloader";
import VideoHero from "./VideoHero";
import PartnerTestimonials from "./PartnerTestimonials";
import Advantages from "./Advantages";
import ProductImages from "./ProductImages";
import Marquee from "./Marquee";
import PriceListForm from "./PriceListForm";
import FAQ from "./FAQ";
import Mission from "./Mission";
import Production from "./Production";
import Team from "./Team";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <Preloader />
      <LandingHeader onToggleMenu={toggleMenu} isMenuOpen={isMenuOpen} onOpenMap={() => setIsMapOpen(true)} />
      <BurgerMenu isOpen={isMenuOpen} onClose={closeMenu} pageRef={pageRef} />
      <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />

      <div ref={pageRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        <VideoHero />
        {/* Wrap Marquee + ProductImages so sticky only works within this scope */}
        <div style={{ position: "relative" }}>
          <Marquee />
          <ProductImages />
        </div>
        <PartnerTestimonials />
        <Advantages />
        <PriceListForm />
        <FAQ />
        <Mission />
        <Production />
        <Team />
        <LandingFooter />
      </div>
    </>
  );
}
