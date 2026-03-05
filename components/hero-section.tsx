"use client"

import Image from "next/image"

const icons = [
  "/committee-imgs/Screenshot__229_-removebg-preview.png",
  "/committee-imgs/Screenshot__230_-removebg-preview.png",
  "/committee-imgs/Screenshot__232_-removebg-preview.png",
  "/committee-imgs/Screenshot__233_-removebg-preview.png",
  "/committee-imgs/Screenshot__234_-removebg-preview.png",
  "/committee-imgs/Screenshot__236_-removebg-preview.png",
]

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-primary to-primary-dark text-white overflow-hidden">
      {/* Background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <Image
            src="/Saef.png"
            alt="الاتحاد السعودي للفروسية"
            width={300}
            height={300}
            priority
            className="w-44 md:w-56 lg:w-64 h-auto"
          />
        </div>

        {/* Title */}
        <h1 className="mb-4 md:mb-6 text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          بوابة اللجان الفنية
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-3xl text-lg md:text-xl text-white/90 leading-relaxed">
          منصة رقمية موحدة لخدمة الأندية والفرسان وموظفي الاتحاد
        </p>

        {/* Icons */}
        <div className="flex gap-3 py-3 px-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-5xl mb-6 overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible">
          {icons.map((src, i) => (
            <div
              key={i}
              className="flex items-center justify-center h-14 md:h-20 lg:h-24 w-14 md:w-20 lg:w-24 mx-auto bg-[#1A3038] rounded-xl shadow-sm hover:scale-105 hover:bg-white/60 transition"
            >
              <Image
                src={src}
                alt="لجان فنية"
                width={200}
                height={200}
                className="object-contain w-4/5 h-4/5"
              />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <a
          href="#serv"
          className="px-8 py-3 bg-white text-primary font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          تصفح الخدمات
        </a>
      </div>

      {/* Curved bottom divider */}
      <div className="absolute bottom-0 w-full overflow-hidden leading-[0]">
        <svg
          className="relative block w-full h-20"
          viewBox="0 0 1440 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#ffffff"
            fillOpacity="0.1"
            d="M0,224L48,192C96,160,192,96,288,106.7C384,117,480,203,576,208C672,213,768,139,864,112C960,85,1056,107,1152,128C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
    </section>
  )
}