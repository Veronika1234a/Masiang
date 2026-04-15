import Image from "next/image";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { MarketingHeader, type NavItem } from "@/components/layout/MarketingHeader";
import { LandingProfilePhoto } from "@/components/layout/LandingProfilePhoto";
import { Button } from "@/components/ui/Button";

const assets = {
  texture: "/assets/masiang/texture.svg",
  logo: "/assets/masiang/logo.svg",
  heroPreview: "/assets/masiang/hero-preview.svg",
  realPhoto: "/assets/masiang/photo.png",
  aboutPhoto: "/assets/masiang/photo.png",
  iconPerson: "/assets/masiang/step-person.svg",
  iconDoc: "/assets/masiang/step-doc.svg",
  iconUpload: "/assets/masiang/step-upload.svg",
  iconStamp: "/assets/masiang/step-stamp.svg",
  footerPerson: "/assets/masiang/footer-contact.svg",
  footerSchool: "/assets/masiang/footer-location.svg",
  footerClock: "/assets/masiang/footer-clock.svg",
};

const navItems: NavItem[] = [
  { label: "Beranda", href: "/#beranda" },
  { label: "Layanan", href: "/#layanan" },
  { label: "Tentang", href: "/#tentang" },
  { label: "Kontak", href: "/#kontak" },
];

const steps = [
  {
    title: "Perencanaan Pendampingan Sekolah",
    description: "Tahap 1",
    icon: assets.iconPerson,
  },
  {
    title: "Pendampingan terhadap Perencanaan Program Kerja Sekolah",
    description: "Tahap 2",
    icon: assets.iconDoc,
  },
  {
    title: "Pendampingan terhadap Pelaksanaan Proker Sekolah",
    description: "Tahap 3",
    icon: assets.iconUpload,
  },
  {
    title: "Pelaporan Hasil Pendampingan Sekolah",
    description: "Tahap 4",
    icon: assets.iconStamp,
  },
];

const visionStatement =
  "Menjadi Pendamping Sekolah yang Profesional, Inspiratif, dan Kolaboratif dalam Mewujudkan Layanan Pendidikan Berkualitas, berkarakter, serta berorientasi pada murid.";

const missionPoints = [
  {
    letter: "M",
    title: "Melayani",
    description: "Pendampingan profesional, humanis, dan berfokus pada kebutuhan sekolah serta murid.",
  },
  {
    letter: "A",
    title: "Adaptif",
    description: "Strategi pendampingan yang fleksibel dan responsif terhadap dinamika pendidikan.",
  },
  {
    letter: "S",
    title: "Sinergi",
    description: "Kemitraan kuat dengan kepala sekolah, guru, dan stakeholder pendidikan.",
  },
  {
    letter: "I",
    title: "Inspiratif",
    description: "Menjadi teladan dalam peningkatan mutu pembelajaran yang inovatif dan berkarakter.",
  },
  {
    letter: "A",
    title: "Asimetris",
    description: "Pendampingan berbasis kebutuhan spesifik setiap satuan pendidikan.",
  },
  {
    letter: "N",
    title: "Nyata",
    description: "Dampak nyata melalui evaluasi berkelanjutan dan berbasis data.",
  },
  {
    letter: "G",
    title: "Gemilang",
    description: "Peningkatan mutu layanan pendidikan yang signifikan dan berorientasi pada murid.",
  },
];

const contactDetails = {
  phone: "085341111160",
  address: "Jln. Tongkonan Ada' Nomor 2 Makale, Keluarahan Bombongan, Kecamatan Makale, Tana Toraja",
  hours: "07.00 - 16.00 WITA",
};

const contactItems = [
  {
    title: "Kontak",
    value: [contactDetails.phone],
    icon: assets.footerPerson,
  },
  {
    title: "Alamat",
    value: [contactDetails.address],
    icon: assets.footerSchool,
  },
  {
    title: "Jam Operasional",
    value: [contactDetails.hours],
    icon: assets.footerClock,
  },
];

export default function Home() {
  return (
    <main className="overflow-x-clip bg-[radial-gradient(1100px_420px_at_12%_-8%,#ffffff_8%,transparent_60%),radial-gradient(900px_400px_at_100%_0%,#d9e0f1_0%,transparent_56%),var(--bg)]">
      <section
        id="beranda"
        className="relative min-h-[760px] overflow-hidden bg-[linear-gradient(155deg,#1f2f4f_0%,#111f3a_88%)] px-4 pb-24 pt-6 text-slate-50 sm:px-6"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image
            src={assets.texture}
            alt=""
            fill
            priority
            className="object-cover opacity-40 mix-blend-soft-light"
          />
        </div>
        <div
          className="pointer-events-none absolute left-[-70px] top-[70px] h-[300px] w-[300px] rounded-full bg-[rgba(255,148,8,0.24)] blur-[38px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-120px] top-[120px] h-[360px] w-[360px] rounded-full bg-[rgba(119,150,224,0.34)] blur-[38px]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-[1220px]">
          <MarketingHeader
            logoSrc={assets.logo}
            brandName="MASIANG"
            navItems={navItems}
            loginHref="/login"
            registerHref="/daftar-sekolah"
            showLogo={false}
          />
        </div>

        <div className="relative z-10 mx-auto mt-16 max-w-[1220px] lg:mt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center">
            <div className="animate-[fadeUp_0.6s_ease_both]">
              <p className="m-0 text-[13px] font-bold uppercase tracking-[0.15em] text-[#ffd397]">
                Sistem Pendampingan Pendidikan
              </p>
              <h1 className="mt-3 font-fraunces text-[clamp(42px,6vw,78px)] leading-[1.03] text-[#f8f9ff]">
                Sistem Pendampingan
                <br />
                Berbasis MASIANG
              </h1>
              <p className="mt-6 max-w-[760px] text-[clamp(16px,1.7vw,24px)] leading-[1.55] tracking-[0.02em] text-[#dde5f8]">
                Mendampingi sekolah dalam meningkatkan mutu pendidikan melalui
                pendekatan yang terstruktur, berbasis data, dan berkelanjutan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/daftar-sekolah" variant="primary" size="lg">
                  Ajukan Pendampingan
                </Button>
                <Button href="/#layanan" variant="dark" size="lg">
                  Lihat Alur
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white">
                  Terstruktur
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white">
                  Transparan
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white">
                  Kolaboratif
                </span>
              </div>
            </div>

            <figure className="animate-[fadeUp_0.6s_ease_0.12s_both] overflow-hidden rounded-[20px] border-[8px] border-white bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.85),0_0_40px_rgba(244,247,255,0.62),0_18px_46px_rgba(8,11,25,0.45)]">
              <Image
                src={assets.heroPreview}
                alt="Preview dashboard MASIANG"
                width={700}
                height={460}
                priority
                className="h-auto w-full"
              />
              <figcaption className="bg-[#f5f7ff] px-4 py-3 text-[13px] font-bold tracking-[0.03em] text-[#1f2f4f]">
                Contoh tampilan dashboard pendampingan
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="layanan" className="mx-auto max-w-[1220px] px-4 py-20 sm:px-6 lg:py-24">
        <div className="text-center">
          <p className="m-0 text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#6b7ea7]">
            Alur Layanan
          </p>
          <h2 className="mt-3 font-fraunces text-[clamp(38px,5vw,64px)] leading-[1.1] text-[#1f2f4f]">
            Tahapan Pendampingan
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <article
              key={step.title}
              className="flex min-h-[294px] flex-col items-center rounded-[18px] border border-slate-200 bg-[#f7f8fc] p-6 text-center shadow-[0_16px_24px_rgba(22,34,60,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_30px_rgba(22,34,60,0.14)]"
            >
              <div className="flex h-[90px] w-[90px] items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#edf2ff_0%,#e8eefc_100%)]">
                <Image src={step.icon} alt="" width={46} height={46} className="block" />
              </div>
              <h3 className="mt-5 max-w-[250px] text-[15px] font-extrabold uppercase leading-[1.35] tracking-[0.04em] text-[#151e34]">
                <span className="mr-2 inline-block text-[#ff9409]">0{idx + 1}.</span>
                {step.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.55] tracking-[0.02em] text-[#4f5b77]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="tentang"
        className="mx-auto grid max-w-[1220px] gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:pb-24"
      >
        <aside className="animate-[fadeUp_0.6s_ease_both] lg:sticky lg:top-8">
          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#eef3fb_0%,#dde4f2_100%)] shadow-[0_14px_34px_rgba(21,32,55,0.12)]">
            <div className="relative aspect-[4/5] w-full p-5">
              <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between">
                <span className="rounded-full bg-white/78 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6b7ea7] backdrop-blur">
                  Pengawas
                </span>
              </div>
              <div className="flex h-full items-center justify-center pt-5">
                <LandingProfilePhoto
                  primarySrc={assets.realPhoto}
                  fallbackSrc={assets.aboutPhoto}
                  alt="Potret Ilyas Kala Lembang, M.Pd."
                  width={700}
                  height={860}
                  className="h-full w-full object-contain object-center"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_26px_rgba(22,34,58,0.06)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6b7ea7]">
              Kontak
            </p>
            <p className="mt-2 text-[15px] font-semibold leading-[1.45] text-[#1f2f4f]">
              {contactDetails.phone}
            </p>
            <p className="mt-3 text-[13px] leading-[1.55] text-[#62739a]">
              {contactDetails.address}
            </p>
            <p className="mt-3 text-[13px] font-semibold leading-[1.55] text-[#1f2f4f]">
              {contactDetails.hours}
            </p>
          </div>
        </aside>

        <article className="animate-[fadeUp_0.6s_ease_0.08s_both] rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fc_100%)] px-6 py-7 shadow-[0_18px_40px_rgba(22,34,58,0.08)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="max-w-[860px]">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#6b7ea7]">
              Tentang Pengawas
            </p>
            <h2 className="mt-3 font-fraunces text-[clamp(36px,4.5vw,64px)] leading-[1.02] text-[#1f2f4f]">
              Ilyas Kala Lembang,
              <br />
              M.Pd.
            </h2>
            <p className="mt-4 max-w-[640px] text-[17px] leading-[1.7] text-[#4f5b77]">
              Pendamping sekolah yang berfokus pada mutu layanan pendidikan, penguatan kolaborasi,
              dan langkah pendampingan yang benar-benar bisa dipakai sekolah.
            </p>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="rounded-[24px] border border-[#ff9409]/18 bg-[linear-gradient(180deg,#fffaf3_0%,#fff4e4_100%)] px-6 py-6 shadow-[0_16px_30px_rgba(255,148,9,0.08)]">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a5b17]">
                Visi
              </span>
              <p className="mt-4 font-fraunces text-[clamp(24px,2.3vw,34px)] leading-[1.28] text-[#233253]">
                {visionStatement}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="rounded-full border border-[#ff9409]/18 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a5b17]">
                  Profesional
                </span>
                <span className="rounded-full border border-[#ff9409]/18 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a5b17]">
                  Inspiratif
                </span>
                <span className="rounded-full border border-[#ff9409]/18 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a5b17]">
                  Berorientasi Murid
                </span>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_26px_rgba(22,34,58,0.05)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-[#6b7ea7]">
                    Misi Pendamping Sekolah berbasis MASIANG
                  </p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[#62739a]">
                    Disusun ringkas agar mudah dipindai. Gulir untuk melihat semua poin.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-[#f8faff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#62739a]">
                  Scroll
                </span>
              </div>

              <div className="mt-4 max-h-[470px] overflow-y-auto pr-1">
                <ul className="grid gap-3">
                  {missionPoints.map((point, index) => (
                    <li
                      key={point.title}
                      className="animate-[fadeUp_0.55s_ease_both] grid grid-cols-[auto_1fr] gap-3 rounded-[18px] border border-slate-200 bg-[#f8faff] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#ffb14f_0%,#ff9409_100%)] text-[13px] font-extrabold text-white shadow-[0_8px_16px_rgba(255,148,9,0.22)]">
                        {point.letter}
                      </div>
                      <div>
                        <strong className="block text-[16px] tracking-[0.01em] text-[#1d2944]">
                          {point.title}
                        </strong>
                        <p className="mt-1.5 text-[14px] leading-[1.6] text-[#55627f]">
                          {point.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </article>
      </section>

      <section className="mx-auto mb-16 flex max-w-[1220px] flex-col gap-6 rounded-[18px] bg-[radial-gradient(ellipse_at_top_right,rgba(210,172,80,0.15),transparent_60%),linear-gradient(140deg,#1d2f51_0%,#101f3b_100%)] px-4 py-8 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h3 className="m-0 font-fraunces text-[clamp(22px,2.3vw,34px)] leading-[1.25]">
            Siap memulai pendampingan sekolah Anda?
          </h3>
          <p className="mt-2 max-w-[480px] text-[14px] leading-[1.55] text-[#c5d0e8]">
            Daftarkan sekolah Anda dan mulai proses pendampingan yang terstruktur bersama MASIANG.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/daftar-sekolah" variant="primary" size="lg">
            Daftar Sekolah
          </Button>
          <Button href="/login" variant="ghost" size="lg">
            Login
          </Button>
        </div>
      </section>

      <MarketingFooter
        id="kontak"
        logoSrc={assets.logo}
        brandName="MASIANG"
        summary="Sistem Pendampingan Berbasis MASIANG. Pendampingan pendidikan yang lebih rapi dan terukur."
        textureSrc={assets.texture}
        contactItems={contactItems}
        showLogo={false}
      />
    </main>
  );
}
