import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5E6CC] px-4 font-sans text-center">
      {/* Dekorációs felső csík a logó zöldjével */}
      {/*<div className="absolute top-0 left-0 right-0 h-3 bg-[#1D6E43]" />*/}

      <div className="max-w-xl mx-auto flex flex-col items-center">
        {/* Itt a logó helye, ha majd be akarod tenni, most egy szép grafikus ikon helyettesíti 
        <div className="mb-6 text-[#C5952B] text-6xl">*/}
        {/*className="rounded-full border-4 border-[#C5952B] object-cover shadow-lg"*/}
        <div className="mb-6 flex justify-center">
          <img
            
            src="/Logo_main_3.png"
            alt="35. törzs - logo"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-[#1D6E43] tracking-tight mb-4">
          Royal Rangers 35. törzs
        </h1>
        
        <p className="text-lg md:text-xl font-medium text-[#4A2A0C] mb-2">
          Üdvözlünk a Royal Rangers Magyarország 35. törzsének oldalán!
        </p>
        
        {/* Kiemelt "Fejlesztés alatt" kártya a logó színeivel */}
        <div className="mt-8 inline-block bg-[#51A347] text-white font-bold px-6 py-3 rounded-full shadow-md transform rotate-[-1deg] hover:rotate-0 transition-transform">
          Az oldal fejlesztés alatt áll, kérünk látogass vissza később!
        </div>
      </div>

      {/* Alsó dekorációs elem - a kenu vöröse egy kis finom részletként */}
      {/*<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-[#9B1111] font-semibold tracking-wider uppercase whitespace-nowrap">*/}
      <div className="flex flex-row absolute bottom-4 items-center gap-4 text-xs text-[#9B1111] font-semibold tracking-wider uppercase">
        <div className="w-8 h-8 flex-shrink-0">
          <img
            src="/Royal-Rangers-Logo.png"
            alt="Royal Rangers - logo"
            className="w-full h-full object-contain"
            />
        </div>
        <div>
          Légy készen! • Albertirsa
        </div>
      </div>
    </div>
  );
}
