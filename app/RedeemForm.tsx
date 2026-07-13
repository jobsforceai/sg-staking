"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_STAKING_API_URL || "http://127.0.0.1:8010";

type Result = {
  purchaseCode: string;
  amountUsd: number;
  amountSgc: number;
  sourceCurrency: string;
};

export function RedeemForm() {
  const [source, setSource] = useState("SGCHAIN");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/coupons/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          code,
          buyerDetails: { fullName, phoneNumber, userId },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "REDEEM_FAILED");
      setResult(data);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "REDEEM_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="redeem-section shell" id="redeem">
      <div className="redeem-copy">
        <span className="kicker">REDEEM COUPON</span>
        <h2>Get your SGX card coupon code.</h2>
        <p>
          Enter your details and redeem a coupon from SGChain, Sagenex, or SGTrading. The issued coupon is shown only once on this screen.
        </p>
      </div>

      <form className="redeem-form" onSubmit={submit}>
        <div className="warning-box">
          The final coupon code will be visible only once. Save it before refreshing, closing, or leaving this page.
        </div>

        <label>
          Source
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="SGCHAIN">SGChain coupon</option>
            <option value="SAGENEX">Sagenex coupon</option>
            <option value="SGTRADING">SGTrading coupon</option>
          </select>
        </label>

        <div className="field-grid">
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} autoComplete="name" />
          </label>
          <label>
            Phone number
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required maxLength={30} autoComplete="tel" />
          </label>
        </div>

        <label>
          User ID, if available
          <input value={userId} onChange={(event) => setUserId(event.target.value)} maxLength={120} />
        </label>

        <label>
          Coupon code
          <input value={code} onChange={(event) => setCode(event.target.value)} required />
        </label>

        <button className="button button-primary" disabled={loading} type="submit">
          {loading ? "Redeeming..." : "Redeem and generate code"}
        </button>

        {error && <p className="form-error">{error}</p>}

        {result && (
          <div className="result-box" role="status">
            <small>Your one-time coupon code</small>
            <strong>{result.purchaseCode}</strong>
            <p>
              Value: ${result.amountUsd} / {result.amountSgc} SGC from {result.sourceCurrency}. This code will not be shown again after reload.
            </p>
          </div>
        )}
      </form>
    </section>
  );
}
