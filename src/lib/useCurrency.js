import { useEffect, useState } from 'react';

const CURRENCY_STORAGE_KEY = 'basha_currency';

const CURRENCY_LABELS = {
  USD: '$',
  SAR: 'ر.س',
  YER_OLD: 'ر.ي (قديم)',
  YER_NEW: 'ر.ي (جديد)',
  AED: 'د.إ',
};

export default function useCurrency(settings) {
  const getDefaultCurrency = () => localStorage.getItem(CURRENCY_STORAGE_KEY) || settings?.currency || 'USD';
  const [currency, setCurrency] = useState(getDefaultCurrency);

  useEffect(() => {
    if (!localStorage.getItem(CURRENCY_STORAGE_KEY)) {
      setCurrency(settings?.currency || 'USD');
    }
  }, [settings?.currency]);

  useEffect(() => {
    const syncCurrency = () => setCurrency(getDefaultCurrency());
    window.addEventListener('basha-currency-change', syncCurrency);
    return () => {
      window.removeEventListener('basha-currency-change', syncCurrency);
    };
  }, [settings?.currency]);

  const changeCurrency = (c) => {
    setCurrency(c);
    localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    window.dispatchEvent(new Event('basha-currency-change'));
  };

  const convert = (priceUSD) => {
    const modifier = settings?.global_price_modifier || 0;
    const adjusted = (priceUSD || 0) * (1 + modifier / 100);
    const rate = settings?.exchange_rates?.[currency] ?? (currency === 'USD' ? 1 : 1);
    return Math.round(adjusted * rate * 100) / 100;
  };

  const format = (priceUSD) => {
    const converted = convert(priceUSD);
    return `${converted.toLocaleString('ar-SA')} ${CURRENCY_LABELS[currency] || currency}`;
  };

  return { currency, setCurrency: changeCurrency, convert, format, CURRENCY_LABELS };
}