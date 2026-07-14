export const API_URL =
  process.env.NEXT_PUBLIC_STAKING_API_URL ||
  "https://sg-staking-backend.onrender.com";

export const TOKEN_KEY = "sagenex_staking_token";
export const USER_KEY = "sagenex_staking_user";

export type StakingUser = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
};

export type Stake = {
  id: string;
  source: string;
  amountUsd: number;
  amountSgc: number;
  sourceCurrency?: string;
  withdrawalMethods?: string[];
  status: string;
  createdAt: string;
};

export type Withdrawal = {
  id: string;
  method: "CASH" | "USDT";
  amountUsd: number;
  walletAddress?: string | null;
  status: string;
  createdAt: string;
  rejectionReason?: string | null;
  transactionRef?: string | null;
};

export type Dashboard = {
  stakedAmountUsd: number;
  stakedAmountSgc: number;
  interestAccruedUsd: number;
  interestLockedUsd: number;
  withdrawableInterestUsd: number;
  withdrawableByMethod: { CASH: number; USDT: number };
  stakes: Stake[];
  withdrawals: Withdrawal[];
  interestPolicy: {
    ratePercent: number;
    cycleDays: number;
    principalLocked: boolean;
  };
  disclaimer: string;
};

export function saveSession(token: string, user: StakingUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string | null) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "REQUEST_FAILED") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function number(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number(value || 0));
}

export function friendlyError(error: unknown) {
  const raw = error instanceof Error ? error.message : "Something went wrong";
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: "The email or password is incorrect.",
    EMAIL_ALREADY_EXISTS: "An account already exists for this email.",
    INVALID_OR_EXPIRED_COUPON: "This coupon is invalid, expired, or has already been used.",
    INSUFFICIENT_WITHDRAWABLE_INTEREST: "The amount is above your available interest.",
    PROOF_REQUIRED: "Add at least one payment proof file.",
    MAX_3_FILES: "You can upload up to three proof files.",
    MAX_FILE_SIZE_5MB: "Each proof file must be 5 MB or smaller.",
    WALLET_ADDRESS_REQUIRED: "Enter the USDT wallet address that should receive the withdrawal.",
  };
  return messages[raw] || raw.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}
