"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUserProfile } from "@/lib/miagent-api";

export default function MicrosoftCallbackPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Lấy token từ query params
      const token = searchParams.get("console_token");
      
      if (!token) {
        const errorParam = searchParams.get("error");
        setError(errorParam || "Không nhận được token");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      try {
        // Lưu token vào localStorage ngay lập tức (theo cách của aht-miagent)
        localStorage.setItem("token", token);
        localStorage.setItem("auth_provider", "microsoft");

        // Thử lấy thông tin user từ aht-miagent (không bắt buộc)
        // Nếu fail, vẫn cho phép vào trang chủ vì token đã được lưu
        try {
          const userProfile = await getUserProfile();
          
          // Lưu thông tin user nếu lấy được
          localStorage.setItem("user", JSON.stringify(userProfile));
          localStorage.setItem("username", userProfile.name || userProfile.email);
          localStorage.setItem("userEmail", userProfile.email);
        } catch (profileError: any) {
          console.warn("Error fetching user profile (non-critical):", profileError);
          // Không redirect về login nếu chỉ là lỗi getUserProfile
          // Token đã được lưu, có thể vào trang chủ
        }

        // Xóa flag force_account_selection sau khi đăng nhập thành công
        localStorage.removeItem("force_account_selection");
        
        // Chuyển hướng về trang chủ bằng window.location.href để clean URL (theo cách của aht-miagent)
        window.location.href = "/";
      } catch (err: any) {
        console.error("Error in callback:", err);
        setError(err.message || "Lỗi khi xử lý đăng nhập");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <p className="text-gray-600">Đang chuyển về trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
