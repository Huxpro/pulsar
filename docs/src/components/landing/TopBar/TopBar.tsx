import { useState } from 'react';
import styles from './TopBar.module.scss';

import logo from '../../../assets/logo.svg';
import logoGitHub from '../../../assets/landing-page/logo-github.png';
import menuIcon from '../../../assets/landing-page/menu.svg';
import closeIcon from '../../../assets/landing-page/x.svg';
import { BASE_PATH } from '../../../../config';

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.logoHolder}>
          <img src={logo.src} alt="Logo" />
          <span>Lynx Pulsar</span>
        </div>
        <div className={styles.menuItems}>
          <a href={`${BASE_PATH}/lynx/overview/`}>Get started</a>
          <a href={`${BASE_PATH}/sdk/lynx/`}>SDK</a>
          <a href="https://docs.swmansion.com/pulsar" target="_blank" rel="noopener">
            Upstream ↗
          </a>
        </div>
        <a href="https://github.com/Huxpro/pulsar" target="_blank" rel="noopener">
          <img className={styles.gitLogo} src={logoGitHub.src} alt="GitHub" />
        </a>
        <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle menu">
          <img src={menuIcon.src} alt="Menu" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={closeMenu}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileMenuHeader}>
              <div className={styles.logoHolder}>
                <img src={logo.src} alt="Logo" />
                <span>Lynx Pulsar</span>
              </div>
              <img
                src={closeIcon.src}
                className={styles.closeButton}
                onClick={closeMenu}
                aria-label="Close menu"
              />
            </div>
            <nav className={styles.mobileMenuItems}>
              <a href={`${BASE_PATH}/lynx/overview/`} onClick={closeMenu}>
                Get started
              </a>
              <a href={`${BASE_PATH}/sdk/lynx/`} onClick={closeMenu}>
                SDK
              </a>
              <a href="https://docs.swmansion.com/pulsar" target="_blank" rel="noopener" onClick={closeMenu}>
                Upstream ↗
              </a>
            </nav>
            <div className={styles.mobileMenuFooter}>
              <a href="https://github.com/Huxpro/pulsar" target="_blank" rel="noopener">
                <img className={styles.gitLogo} src={logoGitHub.src} alt="GitHub" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
