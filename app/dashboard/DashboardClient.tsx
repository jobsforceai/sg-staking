"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CryptoDepositForm } from "../CryptoDepositForm";
import { RedeemForm } from "../RedeemForm";
import {
  apiRequest,
  clearSession,
  Dashboard,
  friendlyError,
  getToken,
  money,
  number,
  StakingUser,
  USER_KEY,
} from "../lib/staking-api";

type DashboardResponse = { user: StakingUser; dashboard: Dashboard };

function Status({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes("approved") || normalized.includes("active") ? "success" : normalized.includes("reject") ? "danger" : "pending";
  return <span className={`status-badge ${tone}`}>{value.replaceAll("_", " ")}</span>;
}

function WithdrawalForm({ token, dashboard, onDashboard }: { token: string; dashboard: Dashboard; onDashboard: (value: Dashboard) => void }) {
  const [method, setMethod] = useState<"CASH" | "USDT">("CASH");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const available = dashboard.withdrawableByMethod?.[method] || 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await apiRequest<{ dashboard: Dashboard }>("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify({ method, amountUsd: Number(amount), ...(method === "USDT" ? { walletAddress: walletAddress.trim() } : {}) }),
      }, token);
      onDashboard(data.dashboard);
      setAmount("");
      setWalletAddress("");
      setMessage("Withdrawal submitted and pending administrator review.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel action-form withdrawal-panel" onSubmit={submit}>
      <div className="panel-heading"><span className="panel-icon">↗</span><div><small>INTEREST WITHDRAWAL</small><h2>Request a payout</h2></div></div>
      <p className="panel-copy">Only accrued interest is withdrawable. Your staked principal remains locked.</p>
      <div className="method-switch"><button type="button" className={method === "CASH" ? "active" : ""} onClick={() => setMethod("CASH")}>Cash</button><button type="button" className={method === "USDT" ? "active" : ""} onClick={() => setMethod("USDT")}>USDT</button></div>
      <div className="available-line"><span>Available by {method}</span><strong>{money(available)}</strong></div>
      <label>Amount in USD<input type="number" min="0.01" max={available || undefined} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
      {method === "USDT" && <label>USDT wallet address<input required value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder="0x…" /></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button button-primary" type="submit" disabled={loading || available <= 0}>{loading ? "Submitting…" : available <= 0 ? "No interest available" : "Submit withdrawal"}</button>
    </form>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const [token] = useState(() => getToken() || "");
  const [user, setUser] = useState<StakingUser | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (sessionToken: string) => {
    try {
      const data = await apiRequest<DashboardResponse>("/api/me/dashboard", {}, sessionToken);
      setUser(data.user);
      setDashboard(data.dashboard);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (err) {
      if ((err as Error & { status?: number }).status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    const timer = window.setTimeout(() => load(token), 0);
    return () => window.clearTimeout(timer);
  }, [load, router, token]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (loading) return <main className="dashboard-loading"><div className="loading-coin">SGC</div><p>Preparing your staking dashboard…</p></main>;
  if (!dashboard || !user) return <main className="dashboard-loading"><p>{error || "Dashboard unavailable."}</p><button className="button button-primary" onClick={() => token && load(token)}>Try again</button></main>;

  const policy = dashboard.interestPolicy || { ratePercent: 3, cycleDays: 30, principalLocked: true };
  return (
    <main className="dashboard-page">
      <header className="dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark"><Image src="/sagenex-logo-transparent.png" alt="" width={52} height={52} /></span><span className="brand-name">SAGENEX <b>STAKING</b></span></Link>
        <div className="dashboard-user"><div><small>SIGNED IN AS</small><b>{user.fullName}</b></div><span>{user.fullName?.charAt(0).toUpperCase()}</span><button onClick={logout}>Log out</button></div>
      </header>

      <div className="dashboard-shell">
        <section className="dashboard-welcome">
          <div><span className="kicker">MEMBER DASHBOARD</span><h1>Good to see you, {user.fullName.split(" ")[0]}.</h1><p>Your live staking position, interest, and requests—all in one place.</p></div>
          <div className="policy-chip"><span>{policy.ratePercent}%</span><div><b>Every {policy.cycleDays} days</b><small>Interest policy</small></div></div>
        </section>

        <section className="metrics-grid">
          <article className="metric-card primary"><small>TOTAL STAKED</small><strong>{money(dashboard.stakedAmountUsd)}</strong><span>{number(dashboard.stakedAmountSgc, 8)} SGC</span><div className="metric-lock">⌾ Principal locked</div></article>
          <article className="metric-card"><small>INTEREST ACCRUED</small><strong>{money(dashboard.interestAccruedUsd)}</strong><span>At {policy.ratePercent}% per {policy.cycleDays}-day cycle</span></article>
          <article className="metric-card"><small>AVAILABLE TO WITHDRAW</small><strong>{money(dashboard.withdrawableInterestUsd)}</strong><span>{money(dashboard.interestLockedUsd)} currently in review</span></article>
          <article className="metric-card split"><small>WITHDRAWAL ROUTES</small><div><span>Cash<b>{money(dashboard.withdrawableByMethod?.CASH || 0)}</b></span><span>USDT<b>{money(dashboard.withdrawableByMethod?.USDT || 0)}</b></span></div></article>
        </section>

        <section className="dashboard-actions-grid">
          <RedeemForm token={token} onDashboard={setDashboard} />
          <WithdrawalForm token={token} dashboard={dashboard} onDashboard={setDashboard} />
        </section>
        <CryptoDepositForm token={token} />

        <section className="history-grid">
          <article className="panel history-panel">
            <div className="history-head"><div><small>PORTFOLIO</small><h2>Stake history</h2></div><span>{dashboard.stakes.length} total</span></div>
            {dashboard.stakes.length ? <div className="table-wrap"><table><thead><tr><th>Source</th><th>Staked</th><th>SGC</th><th>Date</th><th>Status</th></tr></thead><tbody>{dashboard.stakes.map((stake) => <tr key={stake.id}><td><b>{stake.source}</b><small>{stake.sourceCurrency || "SGC"}</small></td><td>{money(stake.amountUsd)}</td><td>{number(stake.amountSgc, 8)}</td><td>{new Date(stake.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td><Status value={stake.status} /></td></tr>)}</tbody></table></div> : <div className="empty-state"><span>◇</span><b>No stakes yet</b><p>Activate a coupon or submit a crypto deposit to begin.</p></div>}
          </article>
          <article className="panel history-panel">
            <div className="history-head"><div><small>PAYOUTS</small><h2>Withdrawal requests</h2></div><span>{dashboard.withdrawals.length} total</span></div>
            {dashboard.withdrawals.length ? <div className="withdrawal-list">{dashboard.withdrawals.map((withdrawal) => <div key={withdrawal.id}><span className="withdrawal-method">{withdrawal.method === "USDT" ? "₮" : "₹"}</span><div><b>{money(withdrawal.amountUsd)}</b><small>{withdrawal.method} · {new Date(withdrawal.createdAt).toLocaleDateString("en-IN")}</small>{withdrawal.rejectionReason && <em>{withdrawal.rejectionReason}</em>}</div><Status value={withdrawal.status} /></div>)}</div> : <div className="empty-state"><span>↗</span><b>No withdrawal requests</b><p>Eligible interest requests will appear here.</p></div>}
          </article>
        </section>

        <aside className="legal-banner"><div><b>Important legal information</b><p>{dashboard.disclaimer || "SGC staking is a private contractual arrangement and is not a bank deposit, savings product, or regulated deposit scheme in India. Returns are subject to the stated terms and administrative review."}</p></div></aside>
      </div>
    </main>
  );
}
