import Image from "next/image";
import Link from "next/link";
import styles from "./MarketingFooter.module.css";

export interface FooterContactItem {
  title: string;
  value: string[];
  icon: string;
}

interface MarketingFooterProps {
  id?: string;
  logoSrc: string;
  brandName: string;
  summary: string;
  textureSrc: string;
  contactItems: FooterContactItem[];
  showLogo?: boolean;
}

export function MarketingFooter({
  id,
  logoSrc,
  brandName,
  summary,
  textureSrc,
  contactItems,
  showLogo = true,
}: MarketingFooterProps) {
  return (
    <footer id={id} className={styles.footer}>
      <div className={styles.textureWrap} aria-hidden="true">
        <Image src={textureSrc} alt="" fill className={styles.texture} />
      </div>

      <div className={styles.content}>
        <div className={styles.footerGrid}>
          {contactItems.map((item) => (
            <article key={item.title} className={styles.footerCard}>
              <Image src={item.icon} alt="" width={56} height={56} aria-hidden="true" />
              <div>
                <h4>{item.title}</h4>
                {item.value.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <Link className={`${styles.brand} ${!showLogo ? styles.brandTextOnly : ""}`} href="/">
            {showLogo ? (
              <Image src={logoSrc} alt={`${brandName} logo`} width={54} height={54} />
            ) : null}
            <span>{brandName}</span>
          </Link>
          <p>{summary}</p>
        </div>
      </div>
    </footer>
  );
}
