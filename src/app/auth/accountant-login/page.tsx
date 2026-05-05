"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function AccountantLogin() {
  const router = useRouter()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    try {
      setLoading(true)

      const res  = await fetch("/api/auth/accountant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data?.success) {
        localStorage.setItem("accountant_token", data.token)
        localStorage.setItem("AccountantData",   JSON.stringify(data.data))
        localStorage.setItem("roletype",         "accountant")
        router.push("/dashboard/accountant")
      } else {
        setError(data?.message || "Login failed")
      }
    } catch {
      setError("Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 dark:bg-black text-gray-900 dark:text-white">
      <form className="w-full max-w-sm" onSubmit={handleLogin}>

        <div className="mb-10">
          <h1 className="text-2xl font-light tracking-tight">Accountant Sign in</h1>
          <p className="text-sm text-gray-400 mt-1">Finance portal access</p>
        </div>

        <div className="space-y-4 mb-8">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-0 py-3 text-sm bg-transparent border-b border-gray-200 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-0 py-3 text-sm bg-transparent border-b border-gray-200 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-medium rounded-sm hover:bg-gray-800 active:bg-gray-900 transition-all duration-200 disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Continue"}
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ← Back to main login
          </button>
        </div>

      </form>
    </div>
  )
}
