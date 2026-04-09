"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./MarketingHeader.module.css";

export interface NavItem {
  label: string;
  href: string;
}

interface MarketingHeaderProps {
  logoSrc: string;
  brandName: string;
  navItems: NavItem[];
  loginHref: string;
  registerHref: string;
  showLogo?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MarketingHeader({
  logoSrc,
  brandName,
  navItems,
  loginHref,
  registerHref,
  showLogo = true,
}: MarketingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const menuElement = menuRef.current;
    if (!menuElement) {
      return;
    }

    const focusables = Array.from(
      menuElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    firstFocusable?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || focusables.length === 0) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1120) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header}>
      <Link className={`${styles.brand} ${!showLogo ? styles.brandTextOnly : ""}`} href="/">
        {showLogo ? (
          <Image src={logoSrc} alt={`${brandName} logo`} width={54} height={54} />
        ) : null}
        <span>{brandName}</span>
      </Link>

      <nav className={styles.desktopNav} aria-label="Navigasi utama">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.desktopActions}>
        <Button href={loginHref} variant="ghost">
          Login
        </Button>
        <Button href={registerHref} variant="primary">
          Daftar Sekolah
        </Button>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuButton}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        {isMenuOpen ? "Tutup" : "Menu"}
      </button>

      {isMenuOpen ? (
        <div id="mobile-nav" ref={menuRef} className={styles.mobileMenu}>
          <nav className={styles.mobileNav} aria-label="Navigasi mobile">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.mobileActions}>
            <Button href={loginHref} variant="ghost" size="sm" onClick={closeMenu}>
              Login
            </Button>
            <Button
              href={registerHref}
              variant="primary"
              size="sm"
              onClick={closeMenu}
            >
              Daftar Sekolah
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
