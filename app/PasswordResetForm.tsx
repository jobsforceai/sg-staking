"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiRequest, friendlyError } from "./lib/staking-api";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setMessage("If an account exists for this email, a reset link has been sent.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return <ResetShell title="Reset your password" overline="ACCOUNT ACCESS" onSubmit={submit} loading={loading} error={error} message={message}>
    <label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com" /></label>
  </ResetShell>;
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: form.get("password") }),
      });
      setMessage("Password updated. You can sign in now.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return <ResetShell title="Create a new password" overline="SECURE RESET" onSubmit={submit} loading={loading} error={error} message={message}>
    <label>New password<input name="password" required type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></label>
  </ResetShell>;
}

function ResetShell({ title, overline, children, onSubmit, loading, error, message }: {
  title: string;
  overline: string;
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string;
  message: string;
}) {
  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/">
        <Image src="/sagenex-logo-transparent.png" alt="Sagenex" width={58} height={58} priority />
        <span>SAGENEX <b>STAKING</b></span>
      </Link>
      <section className="auth-shell">
        <div className="auth-story">
          <span className="kicker">SGCOIN · MEMBER PORTAL</span>
          <h1>Account recovery.</h1>
          <p>Use your registered email to regain access to the staking dashboard.</p>
        </div>
        <form className="auth-card" onSubmit={onSubmit}>
          <div><span className="auth-overline">{overline}</span><h2>{title}</h2></div>
          {children}
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? "Please wait..." : "Continue"}<span>→</span></button>
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
      <p className="auth-footnote">SGC staking is a private contractual arrangement and is not a bank deposit, savings product, or regulated deposit scheme in India.</p>
    </main>
  );
}
