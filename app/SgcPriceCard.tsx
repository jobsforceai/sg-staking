"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const API_URL = process.env.NEXT_PUBLIC_STAKING_API_URL || "https://sg-staking-backend.onrender.com";

export function SgcPriceCard() {
  const [price, setPrice] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/sgc/price`)
      .then((response) => response.json())
      .then((data) => setPrice(Number(data.priceUsd || 0)))
      .catch(() => setPrice(0));
  }, []);

  useEffect(() => {
    if (price === null || !priceRef.current || !cardRef.current) return;
    const output = priceRef.current;
    const format = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      output.textContent = format(price);
      return;
    }

    const counter = { value: 0 };
    const context = gsap.context(() => {
      gsap.to(counter, {
        value: price,
        duration: 1.65,
        ease: "power3.out",
        snap: { value: 0.0001 },
        onStart: () => output.classList.add("is-counting"),
        onUpdate: () => { output.textContent = format(counter.value); },
        onComplete: () => {
          output.textContent = format(price);
          output.classList.remove("is-counting");
        },
        scrollTrigger: { trigger: cardRef.current, start: "top 92%", once: true },
      });
    }, cardRef);
    return () => context.revert();
  }, [price]);

  return (
    <div className="wallet-card" ref={cardRef}>
      <div className="wallet-top"><span>SGC coin price</span><span className="live-dot">LIVE</span></div>
      <strong><span ref={priceRef}>{price === null ? "Loading" : "$0"}</span> <small>USD</small></strong>
      <div className="wallet-bottom"><span>Fetched from SGChain</span><b>{price === null ? "Syncing" : "Ready"}</b></div>
    </div>
  );
}
