import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name.trim() } },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <motion.div
      className="max-w-md mx-auto py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="font-serif text-3xl font-bold mb-2 text-brown">Create your account</h2>
      <p className="text-brown-light mb-8">Join the group and start predicting matches.</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-brown mb-1">Your name</label>
          <input
            type="text"
            placeholder="e.g. Alex"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-cream-dark border border-parchment text-brown placeholder-brown-light focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brown mb-1">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-cream-dark border border-parchment text-brown placeholder-brown-light focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brown mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-lg bg-cream-dark border border-parchment text-brown placeholder-brown-light focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 rounded-lg bg-gold text-brown-dark font-bold hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brown-light">
        Already have an account?{' '}
        <Link to="/login" className="text-pitch font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </motion.div>
  )
}
