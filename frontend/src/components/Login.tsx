import { useState } from "react";
import { User } from "../types";
import "./Login.css";

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Mock login - replace with actual API call
      // const response = await fetch('https://safetnet.onrender.com/api/auth/login/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });
      
      // Mock authentication for demo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate different users
      if (username === "admin" && password === "admin123") {
        const user: User = {
          id: "1",
          username: "admin",
          email: "admin@aiplatform.com",
          role: "admin",
          name: "Admin User",
          avatar: undefined
        };
        onLogin(user, "mock-admin-token");
      } else if (username === "subadmin" && password === "subadmin123") {
        const user: User = {
          id: "2",
          username: "subadmin",
          email: "subadmin@aiplatform.com",
          role: "subadmin",
          name: "Subadmin User",
          avatar: undefined
        };
        onLogin(user, "mock-subadmin-token");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <img src="/vite.svg" alt="AI Platform" className="login-logo-img" />
          </div>
          <h1 className="login-title">AI Platform</h1>
          <p className="login-subtitle">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-credentials">
            <strong>Demo Credentials:</strong><br />
            Admin: admin / admin123<br />
            Subadmin: subadmin / subadmin123
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;


