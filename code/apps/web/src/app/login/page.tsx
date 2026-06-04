import { LoginForm } from "@/components/auth/auth-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | CoRide",
  description: "Đăng nhập vào tài khoản CoRide của bạn",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#f5f5f7] dark:bg-black">
      <div className="w-full max-w-[420px] space-y-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white mb-3">
            CoRide
          </h1>
          <p className="text-[17px] tracking-[-0.37px] text-[rgba(0,0,0,0.8)] dark:text-[rgba(255,255,255,0.8)]">
            Giải pháp đi chung xe thông minh cho cộng đồng
          </p>
        </div>
        
        <LoginForm />
        
      </div>
    </div>
  );
}
