"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const MIAGENT_API_URL = process.env.NEXT_PUBLIC_MIAGENT_API_URL || "http://localhost:5001";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // FastAPI yêu cầu gửi dạng Form Data cho OAuth2
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Sai tài khoản hoặc mật khẩu");

      const data = await res.json();
      
      // Lưu token vào localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", username);
      
      // Chuyển hướng về trang chat
      router.push("/");
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMicrosoftLogin = () => {
    // URL callback của SCOTS_CHATBOT
    const callbackUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/microsoft/callback`
      : "http://localhost:3000/auth/microsoft/callback";
    
    // Kiểm tra xem có cần force account selection không (sau khi logout)
    const forceAccountSelection = localStorage.getItem("force_account_selection") === "true";
    
    // Build OAuth URL với return_to parameter
    let microsoftLoginUrl = `${MIAGENT_API_URL}/console/api/oauth/login/microsoft?return_to=${encodeURIComponent(callbackUrl)}`;
    
    // Nếu có flag force_account_selection, thêm parameter vào URL
    if (forceAccountSelection) {
      microsoftLoginUrl += `&force_account_selection=true`;
    }
    
    // Redirect đến Microsoft OAuth
    window.location.href = microsoftLoginUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Đăng nhập Scots</h2>
        
        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded">{error}</div>}

        

        {/* Microsoft Login Button */}
        <button
          onClick={handleMicrosoftLogin}
          className="w-full py-2 px-4 bg-[#222225] text-white rounded-md hover:bg-[#2d2d30] transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
            <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
            <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
            <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
          </svg>
          <span>Đăng nhập với Microsoft</span>
        </button>
      </div>
    </div>
  );
}