"use client";

import Image from "next/image";
import { useState } from "react";
import { apiRequest, friendlyError } from "./lib/staking-api";

const ADDRESS = "0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142";
const links = {
  ETH: `https://link.trustwallet.com/send?address=${ADDRESS}&asset=c60`,
  USDT: `https://link.trustwallet.com/send?asset=c60_t0xdAC17F958D2ee523a2206206994597C13D831ec7&address=${ADDRESS}`,
};

export function CryptoDepositForm({ token }: { token: string }) {
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
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!files.length) throw new Error("PROOF_REQUIRED");
      if (files.length > 3) throw new Error("MAX_3_FILES");
      if (files.some((file) => file.size > 5 * 1024 * 1024)) throw new Error("MAX_FILE_SIZE_5MB");
      if (files.some((file) => !allowed.includes(file.type))) throw new Error("Only JPG, PNG, WEBP, and PDF files are accepted.");
      await apiRequest("/api/crypto-deposits", { method: "POST", body: form }, token);
      setMessage("Deposit proof submitted. It is now pending administrator review.");
      event.currentTarget.reset();
      setCoin("USDT");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel crypto-panel">
      <div className="panel-heading"><span className="panel-icon">◇</span><div><small>CRYPTO STAKING</small><h2>Fund with ETH or USDT</h2></div></div>
      <p className="panel-copy">Send funds to the wallet, then upload proof. Your stake appears only after administrator approval.</p>
      <div className="crypto-dashboard-grid">
        <div className="deposit-card compact">
          <div className="coin-tabs"><button className={coin === "USDT" ? "active" : ""} type="button" onClick={() => setCoin("USDT")}>USDT</button><button className={coin === "ETH" ? "active" : ""} type="button" onClick={() => setCoin("ETH")}>ETH</button></div>
          <Image src={coin === "USDT" ? "/usdt-deposit-qr.png" : "/eth-deposit-qr.png"} alt={`${coin} deposit QR code`} width={164} height={164} />
          <small>{coin} RECEIVE ADDRESS</small><code>{ADDRESS}</code>
          <a className="trust-link" href={links[coin]} target="_blank" rel="noreferrer">Open Trust Wallet ↗</a>
        </div>
        <form className="action-form nested" onSubmit={submit}>
          <input type="hidden" name="coin" value={coin} />
          <label>Amount sent<input name="amount" required type="number" min="0.00000001" step="any" placeholder={`Amount in ${coin}`} /></label>
          <label>Transaction hash <span>(optional)</span><input name="txHash" placeholder="0x…" /></label>
          <label>Payment proof<input name="proofFiles" required type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" /><small>Up to 3 files · 5 MB each · JPG, PNG, WEBP, PDF</small></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit proof for review"}</button>
        </form>
      </div>
    </section>
  );
}
