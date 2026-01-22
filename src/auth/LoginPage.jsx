import { useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { UserContext } from '../App'

function LoginPage() {
  const userProvider = useContext(UserContext)
  const navigate = useNavigate()
  const [error, setError] = useState("")
  
  console.log(userProvider.role);

  const loginHandler = async (e) => {
    e.preventDefault()
    setError("")

    const formData = new FormData(e.target)
    const username = formData.get("username")
    const password = formData.get("password")

    const response = await fetch("https://voting-api-wnlq.onrender.com/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" }
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("evm.token", data.token)
      console.log(data.role);
      
      userProvider.setRole("admin")
      navigate("/")
    } else if (response.status === 400) {
      setError("Invalid credentials. Please try again.")
    } else {
      setError("Server error. Please try again later.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-softGray px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-evmBlue text-center mb-6">SMART EVM LOGIN</h1>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={loginHandler} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textGray mb-1">EVM ID</label>
            <input
              type="text"
              name="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-evmBlue"
              placeholder="Enter your EVM ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textGray mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-evmBlue"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-evmBlue hover:bg-evmYellow text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
