"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_STAKING_API_URL || "https://sg-staking-backend.onrender.com";

export function SgcPriceCard() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/sgc/price`)
      .then((response) => response.json())
      .then((data) => setPrice(Number(data.priceUsd || 0)))
      .catch(() => setPrice(0));
  }, []);

  return (
    <div className="wallet-card">
      <div className="wallet-top"><span>SGC coin price</span><span className="live-dot">LIVE</span></div>
      <strong>{price === null ? "Loading" : `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`} <small>USD</small></strong>
      <div className="wallet-bottom"><span>Fetched from SGChain</span><b>{price === null ? "Syncing" : "Ready"}</b></div>
    </div>
  );
}
