import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Login.css";

const LoginCard: React.FC = () => {
  const { loginWithGoogle, loading, error, isLoggedIn } = useAuth();
  const navigate = useNavigate(); // ✅ create navigate function

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      try {
        const accessToken = tokenResponse.access_token;
        if (accessToken) {
          await loginWithGoogle(accessToken);
        } else {
          console.error("No access token received");
        }
      } catch (e) {
        console.error("Login error:", e);
      }
    },
    onError: () => {
      console.error("Google login failed");
    },
  });

  // ✅ Redirect on successful login
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h2 className="login-title">Authenticate</h2>
        <button
          className="custom-google-button"
          onClick={() => login()}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">Illusion Classroom © Meyer Labs</p>
      </div>
    </div>
  );
};

export default LoginCard;
