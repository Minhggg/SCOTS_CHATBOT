"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Đăng nhập Gemini Clone</h2>
        
        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text" 
              className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Đăng nhập
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Chưa có tài khoản? <Link href="/register" className="text-blue-600 hover:underline">Đăng ký ngay (Mock)</Link>
        </p>
      </div>
    </div>
  );
}