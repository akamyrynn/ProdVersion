"use client";

import { useRef } from "react";
import SiteHeader from "./SiteHeader";
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

  return (
    <>
      <Preloader />
      <SiteHeader />

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
