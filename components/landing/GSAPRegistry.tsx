"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

export default function GSAPRegistry() {
  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger, SplitText);
      registered = true;
    }
  }, []);

  return null;
}
