"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getUserProfile } from "@/lib/miagent-api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Xử lý OAuth callback khi có console_token từ URL (từ Microsoft OAuth)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Lấy token từ URL params hoặc từ window.location (fallback)
      const tokenFromParams = searchParams.get("console_token");
      const tokenFromUrl = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get("console_token")
        : null;
      const token = tokenFromParams || tokenFromUrl;
      
      console.log("🔍 OAuth callback check:");
      console.log("  - Token from searchParams:", tokenFromParams ? "Found" : "Not found");
      console.log("  - Token from window.location:", tokenFromUrl ? "Found" : "Not found");
      console.log("  - Current URL:", typeof window !== 'undefined' ? window.location.href : "N/A");
      
      if (!token) {
        console.log("  - No token found, skipping OAuth callback");
        return;
      }

      console.log("✅ Token found, processing OAuth callback...");

      try {
        // Lưu token vào localStorage ngay lập tức (theo cách của aht-miagent)
        localStorage.setItem("token", token);
        localStorage.setItem("auth_provider", "microsoft");
        console.log("  - Token saved to localStorage");

        // Thử lấy thông tin user từ aht-miagent (không bắt buộc)
        try {
          const userProfile = await getUserProfile();
          localStorage.setItem("user", JSON.stringify(userProfile));
          localStorage.setItem("username", userProfile.name || userProfile.email);
          localStorage.setItem("userEmail", userProfile.email);
          console.log("  - User profile saved");
        } catch (profileError: any) {
          console.warn("  - Error fetching user profile (non-critical):", profileError);
        }

        // Xóa flag force_account_selection sau khi đăng nhập thành công
        localStorage.removeItem("force_account_selection");
        
        console.log("  - Redirecting to home page...");
        // Dùng window.location.href thay vì router để đảm bảo full page reload và clean URL
        window.location.href = "/";
      } catch (err: any) {
        console.error("❌ Error in OAuth callback:", err);
        setError(err.message || "Lỗi khi xử lý đăng nhập");
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  const handleMicrosoftLogin = () => {
    // Truyền return_to qua query parameter để đảm bảo backend nhận được đúng URL
    // Backend sẽ ưu tiên query parameter, fallback về Referer header
    const returnTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/login`
      : "http://localhost:3001/login";
    
    console.log("🚀 Starting Microsoft OAuth login...");
    console.log("  - return_to:", returnTo);
    console.log("  - Referer will be:", typeof window !== 'undefined' ? window.location.href : "N/A");
    
    window.location.href = `${MIAGENT_API_URL}/console/api/oauth/login/microsoft?return_to=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Đăng nhập Scots</h2>
        
        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded">{error}</div>}

        

        {/* Microsoft Login Button - Dùng onClick với window.location.href để đảm bảo Referer header */}
        <button
          onClick={handleMicrosoftLogin}
          type="button"
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
