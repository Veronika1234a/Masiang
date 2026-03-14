import Image from "next/image";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { MarketingHeader, type NavItem } from "@/components/layout/MarketingHeader";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

const assets = {
  texture: "/assets/masiang/texture.svg",
  logo: "/assets/masiang/logo.svg",
  heroPreview: "/assets/masiang/hero-preview.svg",
  aboutPhoto: "/assets/masiang/about-photo.svg",
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
    title: "Melayani Sekolah",
    description: "Sekolah mendaftar dan mengajukan pendampingan.",
    icon: assets.iconPerson,
  },
  {
    title: "Pendampingan",
    description: "Unggah dokumen kebutuhan program pendampingan.",
    icon: assets.iconDoc,
  },
  {
    title: "Pelaksanaan",
    description: "Monitoring kegiatan dan unggah bukti pelaksanaan.",
    icon: assets.iconUpload,
  },
  {
    title: "Laporan & Evaluasi",
    description: "Unduh hasil pendampingan beserta evaluasinya.",
    icon: assets.iconStamp,
  },
];

const missionPoints = [
  "Mendampingi sekolah meningkatkan mutu pendidikan melalui pendekatan terstruktur, berbasis data, dan berkelanjutan.",
  "Menyediakan alur kolaboratif yang jelas untuk sekolah, pengawas, dan tim pendamping.",
];

const contactItems = [
  {
    title: "Kontak",
    value: ["info@masiang.id", "+62 812 3456 7890"],
    icon: assets.footerPerson,
  },
  {
    title: "Alamat",
    value: ["Jl. Pendidikan No. 21, Tana Toraja"],
    icon: assets.footerSchool,
  },
  {
    title: "Jam Operasional",
    value: ["Senin - Jumat, 08.00 - 16.30 WITA"],
    icon: assets.footerClock,
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} id="beranda">
        <div className={styles.textureWrap} aria-hidden="true">
          <Image src={assets.texture} alt="" fill priority className={styles.texture} />
        </div>
        <div className={styles.glowA} />
        <div className={styles.glowB} />

        <MarketingHeader
          logoSrc={assets.logo}
          brandName="MASIANG"
          navItems={navItems}
          loginHref="/login"
          registerHref="/daftar-sekolah"
        />

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.overline}>Sistem Pendampingan Pendidikan</p>
            <h1>
              Sistem Pendampingan
              <br />
              Berbasis MASIANG
            </h1>
            <p className={styles.subtitle}>
              Mendampingi sekolah dalam meningkatkan mutu pendidikan melalui
              pendekatan yang terstruktur, berbasis data, dan berkelanjutan.
            </p>
            <div className={styles.heroActions}>
              <Button href="/daftar-sekolah" variant="primary" size="lg">
                Ajukan Pendampingan
              </Button>
              <Button href="/#layanan" variant="dark" size="lg">
                Lihat Alur
              </Button>
            </div>
            <div className={styles.pillRow}>
              <span>Terstruktur</span>
              <span>Transparan</span>
              <span>Kolaboratif</span>
            </div>
          </div>

          <figure className={styles.previewFrame}>
            <Image
              src={assets.heroPreview}
              alt="Preview dashboard MASIANG"
              width={700}
              height={460}
              priority
            />
            <figcaption>Contoh tampilan dashboard pendampingan</figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.stepsSection} id="layanan">
        <div className={styles.sectionHeading}>
          <p>Alur Layanan</p>
          <h2>Tahapan Pendampingan</h2>
        </div>
        <div className={styles.stepGrid}>
          {steps.map((step, idx) => (
            <article key={step.title} className={styles.stepCard}>
              <Image src={step.icon} alt="" width={80} height={80} aria-hidden="true" />
              <h3>
                <span style={{ color: "#d2ac50", marginRight: 4 }}>0{idx + 1}.</span>
                {step.title}
              </h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.aboutSection} id="tentang">
        <div className={styles.aboutPhotoCard}>
          <Image src={assets.aboutPhoto} alt="Tim pendamping MASIANG" width={700} height={860} />
        </div>
        <article className={styles.aboutContent}>
          <p className={styles.aboutTag}>Tentang Pengawas</p>
          <h2>Ilyas Kala Lembang, M.Pd.</h2>
          <p className={styles.aboutLead}>
            Pengawas pendidikan yang berfokus pada peningkatan mutu sekolah
            dengan pendampingan yang adaptif dan berkelanjutan.
          </p>
          <ul className={styles.missionList}>
            {missionPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className={styles.ctaBand}>
        <div>
          <h3>Siap memulai pendampingan sekolah Anda?</h3>
          <p className={styles.ctaSubtext}>
            Daftarkan sekolah Anda dan mulai proses pendampingan yang terstruktur bersama MASIANG.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
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
      />
    </main>
  );
}
