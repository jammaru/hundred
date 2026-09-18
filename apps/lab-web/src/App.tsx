import { useState } from 'react';

import { t, type Locale } from './i18n';

const loadLocale = (): Locale => (localStorage.getItem('jev-lab-locale') === 'en' ? 'en' : 'ja');

export const App = () => {
  const [locale, setLocale] = useState<Locale>(loadLocale);
  const setLang = (next: Locale) => {
    setLocale(next);
    localStorage.setItem('jev-lab-locale', next);
  };

  return (
    <div className="page">
      <header>
        <p className="kicker">{t(locale, 'kicker')}</p>
        <div className="heading">
          <h1>{t(locale, 'title')}</h1>
          <label>
            {t(locale, 'language')}
            <select
              value={locale}
              onChange={(event) => setLang(event.target.value === 'en' ? 'en' : 'ja')}
              aria-label={t(locale, 'language')}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <p className="lead">{t(locale, 'lead')}</p>
      </header>
      <main>
        <a className="card town" href="http://127.0.0.1:5188">
          <span className="eyebrow">01</span>
          <h2>{t(locale, 'hundredTitle')}</h2>
          <p>{t(locale, 'hundredBody')}</p>
          <strong>{t(locale, 'hundredCta')}</strong>
        </a>
        <a className="card board" href="http://127.0.0.1:5191">
          <span className="eyebrow">02</span>
          <h2>{t(locale, 'shogiTitle')}</h2>
          <p>{t(locale, 'shogiBody')}</p>
          <strong>{t(locale, 'shogiCta')}</strong>
        </a>
      </main>
      <footer>{t(locale, 'note')}</footer>
    </div>
  );
};
