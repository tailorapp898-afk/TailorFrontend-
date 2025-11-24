"use client"

import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { Menu, X } from "lucide-react" // 🔹 For hamburger icons

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-xl text-blue-400 hover:text-blue-300 transition"
          onClick={closeMenu}
        >
          TailorBook
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-4 text-sm">
          <Link to="/" className="hover:text-blue-400 transition">
            Dashboard
          </Link>
          <Link to="/families" className="hover:text-blue-400 transition">
            Families
          </Link>
          <Link to="/customers" className="hover:text-blue-400 transition">
            Customers
          </Link>
          <Link to="/templates" className="hover:text-blue-400 transition">
            Templates
          </Link>
          <Link to="/measurements" className="hover:text-blue-400 transition">
            Measurements
          </Link>
          
          <Link to="/invoices" className="hover:text-blue-400 transition">
            Invoices
          </Link>
          <Link to="/analytics" className="hover:text-blue-400 transition">
            Analytics
          </Link>
          <Link to="/settings" className="hover:text-blue-400 transition">
            Settings
          </Link>
        </div>

        {/* User + Logout (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition text-sm"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 animate-slide-down">
          <div className="flex flex-col px-6 py-3 space-y-3 text-sm">
            <Link to="/" onClick={closeMenu} className="hover:text-blue-400">
              Dashboard
            </Link>
            <Link to="/families" onClick={closeMenu} className="hover:text-blue-400">
              Families
            </Link>
            <Link to="/customers" onClick={closeMenu} className="hover:text-blue-400">
              Customers
            </Link>
            <Link to="/templates" onClick={closeMenu} className="hover:text-blue-400">
              Templates
            </Link>
            <Link to="/invoices" onClick={closeMenu} className="hover:text-blue-400">
              Invoices
            </Link>
            <Link to="/analytics" onClick={closeMenu} className="hover:text-blue-400">
              Analytics
            </Link>
            <Link to="/settings" onClick={closeMenu} className="hover:text-blue-400">
              Settings
            </Link>

            {/* User Info & Logout */}
            <hr className="border-slate-700 my-2" />
            <span className="text-slate-300 text-xs">Logged in as: {user?.name}</span>
            <button
              onClick={() => {
                handleLogout()
                closeMenu()
              }}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition text-sm w-fit"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
