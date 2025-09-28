/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import "./../styles/LoginPage.css";
import { useNavigate, Link } from "react-router-dom"; // Link'i import ettik!
import { useAuth } from "../context/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await AuthService.login({ email, password });
      if (response.success) {
        login(response.data);
        navigate("/portfolio");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Portfolyo Yönetimi Kullanıcı Girişi</h2>
          {error && <p className="error-message">{error}</p>}
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Mail"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
          />
          <button type="submit">Giriş</button>
        </form>
        {/* YENİ EKLENEN KISIM: Kayıt sayfasına yönlendirme */}
        <div className="register-link-container">
          Hesabın yok mu? <Link to="/register">Kaydol</Link>
        </div>
      </div>
    </div>
  );
}
