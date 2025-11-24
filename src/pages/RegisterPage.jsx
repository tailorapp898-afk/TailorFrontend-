"use client"

import { useState, useContext } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [shopName, setShopName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(name, email, password, shopName)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-900">Create Account</h1>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
