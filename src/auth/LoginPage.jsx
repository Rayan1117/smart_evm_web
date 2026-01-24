import { useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { UserContext } from '../App'

const theme = {
  header: '#1C74E9',
  headerText: '#FFFFFF',
  cardBg: '#FFFFFF',
  ongoingCardBg: '#EFF6FF',
  bg: '#F5F5F5',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  buttonPrimary: '#1C74E9',
  buttonText: '#FFFFFF',
  bannerGradient: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)',
  bannerBorder: '#1C74E9',
  cardShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontFamily: "'Inter', sans-serif",
}

export default function LoginPage() {
  const userProvider = useContext(UserContext)
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const loginHandler = async (e) => {
    e.preventDefault()
    if (loading) return

    setError("")
    setLoading(true)

    try {
      const formData = new FormData(e.target)
      const username = formData.get("username")
      const password = formData.get("password")

      const response = await fetch(
        "https://voting-api-wnlq.onrender.com/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
          headers: { "Content-Type": "application/json" }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Invalid credentials. Please try again.")
        }
        throw new Error(data?.message || "Server error. Please try again later.")
      }

      localStorage.setItem("evm.token", data.token)
      userProvider.setRole("admin")
      navigate("/")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bg,
      padding: '1rem',
      fontFamily: theme.fontFamily,
    },
    card: {
      maxWidth: '400px',
      width: '100%',
      backgroundColor: theme.cardBg,
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: theme.cardShadow,
    },
    title: {
      textAlign: 'center',
      fontSize: '1.875rem',
      fontWeight: '700',
      color: theme.header,
      marginBottom: '1.5rem',
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      fontSize: '0.875rem',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.25rem',
      marginBottom: '1rem',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: '0.25rem',
    },
    input: {
      padding: '0.5rem 1rem',
      border: '1px solid #D1D5DB',
      borderRadius: '0.5rem',
      outline: 'none',
      fontSize: '1rem',
    },
    button: {
      padding: '0.5rem',
      backgroundColor: loading ? '#93C5FD' : theme.buttonPrimary,
      color: theme.buttonText,
      fontWeight: '600',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.8 : 1,
      transition: 'all 0.2s ease-in-out',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>SMART EVM LOGIN</h1>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={loginHandler} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>EVM ID</label>
            <input
              type="text"
              name="username"
              style={styles.input}
              placeholder="Enter your EVM ID"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              style={styles.input}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
