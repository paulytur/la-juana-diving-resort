"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/form-fields";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Login failed");
      }
      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
