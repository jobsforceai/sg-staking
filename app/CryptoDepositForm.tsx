"use client";

import Image from "next/image";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_STAKING_API_URL || "http://127.0.0.1:8010";
const ADDRESS = "0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142";
const links = {
  ETH: "https://link.trustwallet.com/send?address=0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142&asset=c60",
  USDT: "https://link.trustwallet.com/send?asset=c60_t0xdAC17F958D2ee523a2206206994597C13D831ec7&address=0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142",
};

export function CryptoDepositForm() {
  const [coin, setCoin] = useState<"ETH" | "USDT">("USDT");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const files = form.getAll("proofFiles").filter((file) => file instanceof File && file.size > 0) as File[];
      if (!files.length) throw new Error("PROOF_REQUIRED");
      if (files.length > 3) throw new Error("MAX_3_FILES");
      if (files.some((file) => file.size > 5 * 1024 * 1024)) throw new Error("MAX_FILE_SIZE_5MB");

      const response = await fetch(`${API_URL}/api/crypto-deposits`, { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "SUBMIT_FAILED");
      setMessage("Submitted for admin review. You will receive the code by email after approval.");
      event.currentTarget.reset();
      setCoin("USDT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "SUBMIT_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="crypto-section shell" id="crypto-deposit">
      <div className="redeem-copy">
        <span className="kicker">CRYPTO DEPOSIT</span>
        <h2>Deposit ETH or USDT.</h2>
        <p>Send funds to the wallet below, then submit your details and proof. Admin review is required before the SGX card coupon code is emailed.</p>
      </div>

      <div className="crypto-grid">
        <div className="deposit-card">
          <div className="coin-tabs">
            <button className={coin === "USDT" ? "active" : ""} type="button" onClick={() => setCoin("USDT")}>USDT</button>
            <button className={coin === "ETH" ? "active" : ""} type="button" onClick={() => setCoin("ETH")}>ETH</button>
          </div>
          <Image src={coin === "USDT" ? "/usdt-deposit-qr.png" : "/eth-deposit-qr.png"} alt={`${coin} deposit QR code`} width={220} height={220} />
          <small>{coin} receive address</small>
          <code>{ADDRESS}</code>
          <a className="button button-primary" href={links[coin]} target="_blank" rel="noreferrer">Open Trust Wallet</a>
        </div>

        <form className="redeem-form" onSubmit={submit}>
          <input type="hidden" name="coin" value={coin} />
          <div className="warning-box">Upload only your payment proof. Max 3 files, 5 MB each. JPG, PNG, WEBP, and PDF are allowed.</div>
          <div className="field-grid">
            <label>Full name<input name="fullName" required maxLength={120} autoComplete="name" /></label>
            <label>Phone number<input name="phoneNumber" required maxLength={30} autoComplete="tel" /></label>
          </div>
          <div className="field-grid">
            <label>Email<input name="email" required type="email" autoComplete="email" /></label>
            <label>User ID, if available<input name="userId" maxLength={120} /></label>
          </div>
          <div className="field-grid">
            <label>Deposited amount<input name="amount" required type="number" min="0" step="any" /></label>
            <label>Transaction hash, if available<input name="txHash" /></label>
          </div>
          <label>Proof files<input name="proofFiles" required type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
          <button className="button button-primary" disabled={loading} type="submit">{loading ? "Submitting..." : "Submit for review"}</button>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
        </form>
      </div>
    </section>
  );
}
