"use client";

import { useState } from "react";
import { apiRequest, Dashboard, friendlyError } from "./lib/staking-api";

export function RedeemForm({ token, onDashboard }: { token: string; onDashboard: (dashboard: Dashboard) => void }) {
  const [source, setSource] = useState("SGCHAIN");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await apiRequest<{ dashboard: Dashboard }>("/api/coupons/redeem", {
        method: "POST",
        body: JSON.stringify({ source, code: code.trim() }),
      }, token);
      onDashboard(data.dashboard);
      setCode("");
      setMessage("Coupon verified. Your stake is now active and has been added to the dashboard.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel action-form" onSubmit={submit}>
      <div className="panel-heading"><span className="panel-icon">⌁</span><div><small>COUPON STAKING</small><h2>Activate a stake</h2></div></div>
      <p className="panel-copy">Use a valid coupon from SGChain, Sagenex, or an authorized offline administrator. A successful redemption creates the stake immediately.</p>
      <label>Coupon source<select value={source} onChange={(event) => setSource(event.target.value)}><option value="SGCHAIN">SGChain</option><option value="SAGENEX">Sagenex</option><option value="OFFLINE">Offline administrator</option></select></label>
      <label>Coupon code<input value={code} onChange={(event) => setCode(event.target.value)} required autoComplete="off" placeholder="Enter your coupon code" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Verifying…" : "Verify & activate stake"}<span>→</span></button>
    </form>
  );
}
