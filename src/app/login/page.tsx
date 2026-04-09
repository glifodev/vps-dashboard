"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-2xl bg-bg-card border border-border"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">VPS Ops</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3 rounded-lg bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />

        {error && <p className="mt-3 text-sm text-critical">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full mt-4 px-4 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
