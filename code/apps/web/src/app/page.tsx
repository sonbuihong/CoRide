import Link from "next/link";
import { Car, ShieldCheck, Zap, Users, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <main className="flex-1">
        {/* =========================================
            HERO SECTION (Apple Premium Dark Style)
            ========================================= */}
        <section className="w-full relative bg-black text-white py-24 md:py-32 lg:py-48 flex items-center justify-center min-h-[85vh]">
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center text-center space-y-6">
              
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Car className="h-10 w-10 text-white" />
              </div>

              {/* Headline - SF Pro Display 56px style */}
              <h1 className="text-[48px] md:text-[64px] lg:text-[80px] font-semibold tracking-[-0.02em] leading-[1.05] max-w-[800px]">
                Đi chung xe. <br />
                <span className="text-[#86868b]">Chia sẻ lộ trình.</span>
              </h1>
              
              {/* Subtitle - SF Pro Display 24px style */}
              <p className="mx-auto max-w-[600px] text-[21px] md:text-[24px] font-medium tracking-tight text-[#86868b] leading-[1.3] mt-2">
                Giải pháp di chuyển thông minh, an toàn và bảo vệ môi trường dành cho cộng đồng văn minh.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 pt-4">
                <Link
                  href="/rides/search"
                  className="bg-white text-black font-medium text-[17px] tracking-[-0.22px] px-8 py-3 rounded-[980px] transition-transform hover:scale-105 active:scale-95"
                >
                  Bắt đầu ngay
                </Link>
              </div>
            </div>
          </div>
          
          {/* Subtle glow / gradient backgound for cinematic effect without being a hard texture */}
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-[#1d1d1f] to-transparent opacity-50 pointer-events-none" />
        </section>


        {/* =========================================
            FEATURES SECTION (Apple Light Style)
            ========================================= */}
        <section className="w-full bg-[#f5f5f7] py-24 md:py-32">
          <div className="container px-4 md:px-8 mx-auto max-w-[1200px]">
            
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-[40px] md:text-[48px] font-semibold tracking-tight leading-[1.1] text-[#1d1d1f]">
                Trải nghiệm đỉnh cao.
              </h2>
              <p className="text-[21px] text-[rgba(0,0,0,0.56)] font-medium max-w-[600px] mx-auto">
                Từng tính năng được thiết kế để mang lại sự tiện lợi và an tâm tuyệt đối trên mỗi hành trình.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Feature 1 */}
              <div className="flex flex-col bg-white rounded-[24px] p-10 transition-transform duration-500 hover:scale-[1.02]">
                <ShieldCheck className="h-10 w-10 text-[#1d1d1f] mb-6" />
                <h3 className="text-[24px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
                  An toàn là trên hết.
                </h3>
                <p className="text-[17px] leading-[1.47] text-[rgba(0,0,0,0.56)]">
                  Mọi người dùng trên hệ thống đều được xác minh danh tính qua email và số điện thoại. Hệ thống đánh giá hai chiều minh bạch tuyệt đối.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col bg-white rounded-[24px] p-10 transition-transform duration-500 hover:scale-[1.02]">
                <Zap className="h-10 w-10 text-[#0071e3] mb-6" />
                <h3 className="text-[24px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
                  Tiết kiệm tối đa.
                </h3>
                <p className="text-[17px] leading-[1.47] text-[rgba(0,0,0,0.56)]">
                  Chia sẻ chi phí xăng xe và cầu đường giúp giảm tới 70% gánh nặng tài chính hàng tháng so với đi một mình.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col bg-white rounded-[24px] p-10 transition-transform duration-500 hover:scale-[1.02]">
                <Users className="h-10 w-10 text-[#34c759] mb-6" />
                <h3 className="text-[24px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
                  Cộng đồng văn minh.
                </h3>
                <p className="text-[17px] leading-[1.47] text-[rgba(0,0,0,0.56)]">
                  Kết nối với hàng ngàn người có chung lộ trình. Mở rộng mối quan hệ xã hội đồng thời góp phần bảo vệ môi trường.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* =========================================
          FOOTER
          ========================================= */}
      <footer className="w-full bg-[#f5f5f7] border-t border-[rgba(0,0,0,0.1)] py-8 mt-auto">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center justify-between">
          <p className="text-[12px] text-[rgba(0,0,0,0.56)] mb-4 md:mb-0">
            Bản quyền © 2024 CoRide Inc. Bảo lưu mọi quyền.
          </p>
          <div className="flex space-x-6">
            <Link href="#" className="text-[12px] text-[#1d1d1f] hover:underline">
              Chính sách Quyền riêng tư
            </Link>
            <div className="border-l border-[rgba(0,0,0,0.2)] h-4"></div>
            <Link href="#" className="text-[12px] text-[#1d1d1f] hover:underline">
              Điều khoản Sử dụng
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
