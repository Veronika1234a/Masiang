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
}

export function MarketingFooter({
  id,
  logoSrc,
  brandName,
  summary,
  textureSrc,
  contactItems,
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
          <Link className={styles.brand} href="/">
            <Image src={logoSrc} alt={`${brandName} logo`} width={54} height={54} />
            <span>{brandName}</span>
          </Link>
          <p>{summary}</p>
        </div>
      </div>
    </footer>
  );
}
