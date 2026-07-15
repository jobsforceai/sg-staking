"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, friendlyError, getToken, saveSession, StakingUser } from "./lib/staking-api";

type AuthResponse = { status: string; token: string; user: StakingUser };

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const data = await apiRequest<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      saveSession(data.token, data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  const signup = mode === "signup";
  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/">
        <Image src="/sagenex-logo-transparent.png" alt="Sagenex" width={58} height={58} priority />
        <span>SAGENEX <b>STAKING</b></span>
      </Link>
      <section className="auth-shell">
        <div className="auth-story">
          <span className="kicker">SGCOIN · MEMBER PORTAL</span>
          <h1>{signup ? "Start your staking journey." : "Welcome back."}</h1>
          <p>Track every stake, see interest as it accrues, and submit verified withdrawal requests from one secure account.</p>
          <div className="auth-promise">
            <span>03%</span>
            <div><b>Interest every 30 days</b><small>Principal remains locked. Interest is subject to review and eligibility.</small></div>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div><span className="auth-overline">{signup ? "CREATE ACCOUNT" : "SECURE SIGN IN"}</span><h2>{signup ? "Join Sagenex Staking" : "Access your dashboard"}</h2></div>
          {signup && (
            <div className="auth-fields-two">
              <label>Full name<input name="fullName" required maxLength={120} autoComplete="name" placeholder="Your full name" /></label>
              <label>Phone number<input name="phoneNumber" required maxLength={30} autoComplete="tel" placeholder="+91 98765 43210" /></label>
            </div>
          )}
          <label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com" /></label>
          <label>Password<input name="password" required type="password" minLength={8} autoComplete={signup ? "new-password" : "current-password"} placeholder="At least 8 characters" /></label>
          {!signup && <p className="auth-switch"><Link href="/forgot-password">Forgot password?</Link></p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? "Please wait…" : signup ? "Create account" : "Sign in"}<span>→</span></button>
          <p className="auth-switch">{signup ? "Already have an account?" : "New to Sagenex Staking?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create account"}</Link></p>
        </form>
      </section>
      <p className="auth-footnote">SGC staking is a private contractual arrangement and is not a bank deposit, savings product, or regulated deposit scheme in India.</p>
    </main>
  );
}
