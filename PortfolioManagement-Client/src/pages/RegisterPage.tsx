/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import { useNavigate, Link } from "react-router-dom";
import "./../styles/RegisterPage.css";

export default function RegisterPage() {
  // Kayıt formu için gerekli state'ler
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Kayıt işlemini gerçekleştiren fonksiyon
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Tüm alanların dolu olduğundan emin olmak istersen burada kontrol ekleyebilirsin
    if (!email || !firstName || !lastName || !password) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      // AuthService'teki register metodunu çağır
      const response = await AuthService.register({
        email,
        firstName,
        lastName,
        password,
      });

      // Kayıt başarılıysa
      if (response.success && response.data) {
        alert("Kayıt başarılı! Lütfen giriş yapınız.");
        navigate("/login");
      } else {
        setError(response.message || "Kayıt işlemi başarısız oldu.");
      }
    } catch (err: any) {
      // Hata yakalanırsa (örneğin e-posta zaten kullanımda)
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-container">
        <form className="register-form" onSubmit={handleRegister}>
          <h2>Yeni Kullanıcı Kaydı</h2>
          {error && <p className="error-message">{error}</p>}
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Adınız"
            required
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Soyadınız"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
          />
          <button type="submit">Kaydol</button>
          <div className="login-link-container">
            Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
