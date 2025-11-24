"use client"

import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext)

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return <Navigate to="/login" />
  return children
}
