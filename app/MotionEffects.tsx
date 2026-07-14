"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function MotionEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".hero-copy > *",
        { autoAlpha: 0, y: 26, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.85, stagger: 0.09, ease: "power3.out", clearProps: "filter" },
      );
      gsap.fromTo(
        ".hero-visual",
        { autoAlpha: 0, scale: 0.965, y: 18 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 1.05, delay: 0.15, ease: "power3.out" },
      );

      const revealGroups = [
        ".section-heading > *",
        ".route-card",
        ".handoff > *",
        ".journey-step",
        ".preview-copy > *",
        ".dashboard-mock",
        ".policy-statement > *",
        ".policy-rules article",
        ".withdrawal-cards article",
        ".trust-process-grid > *",
        ".why-intro > *",
        ".benefit-grid article",
        ".safety-title > *",
        ".checks > div",
        ".footer > *",
        ".final-cta-inner > *",
      ];

      revealGroups.forEach((selector) => {
        gsap.utils.toArray<HTMLElement>(selector).forEach((element, index) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 24, filter: "blur(5px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.78,
              delay: Math.min(index * 0.055, 0.18),
              ease: "power3.out",
              clearProps: "filter",
              scrollTrigger: { trigger: element, start: "top 88%", once: true },
            },
          );
        });
      });
    });

    return () => context.revert();
  }, []);

  return null;
}
