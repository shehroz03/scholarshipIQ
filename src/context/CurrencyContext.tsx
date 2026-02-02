import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'USD' | 'PKR' | 'AED' | 'SAR' | 'AUD' | 'CAD' | 'EUR' | 'GBP' | 'TRY';

interface CurrencyInfo {
    code: CurrencyCode;
    symbol: string;
    rate: number; // 1 USD = X Currency
    name: string;
}

export const currencies: Record<CurrencyCode, CurrencyInfo> = {
    USD: { code: 'USD', symbol: '$', rate: 1, name: 'US Dollar' },
    PKR: { code: 'PKR', symbol: 'Rs', rate: 280, name: 'Pakistani Rupee' },
    AED: { code: 'AED', symbol: 'د.إ', rate: 3.67, name: 'UAE Dirham' },
    SAR: { code: 'SAR', symbol: '﷼', rate: 3.75, name: 'Saudi Riyal' },
    AUD: { code: 'AUD', symbol: 'A$', rate: 1.52, name: 'Australian Dollar' },
    CAD: { code: 'CAD', symbol: 'C$', rate: 1.35, name: 'Canadian Dollar' },
    EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' },
    TRY: { code: 'TRY', symbol: '₺', rate: 30.2, name: 'Turkish Lira' },
};

interface CurrencyContextType {
    currency: CurrencyInfo;
    setCurrency: (code: CurrencyCode) => void;
    convertAndFormat: (amountStr: string | undefined | null) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currentCode, setCurrentCode] = useState<CurrencyCode>(() => {
        const saved = localStorage.getItem('scholar_iq_currency');
        return (saved as CurrencyCode) || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('scholar_iq_currency', currentCode);
    }, [currentCode]);

    const currency = currencies[currentCode];

    const convertAndFormat = (amountStr: string | undefined | null): string => {
        if (!amountStr) return "N/A";

        // Handle non-numeric values like "Full Tuition", "Variable", etc.
        if (!/\d/.test(amountStr)) return amountStr;

        // Try to extract the number
        // Remove currency symbols, commas, and non-numeric chars except decimal
        const numericPart = amountStr.replace(/[^\d.]/g, '');
        const value = parseFloat(numericPart);

        if (isNaN(value)) return amountStr;

        // Convert based on rate
        const converted = value * currency.rate;

        // Format based on currency
        if (currentCode === 'PKR') {
            return `${currency.symbol} ${converted.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
        }

        // Special handling for Dirhams and Riyals (manual symbol placement for better control)
        if (currentCode === 'AED' || currentCode === 'SAR') {
            return `${currency.symbol} ${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentCode,
            currencyDisplay: 'symbol',
            maximumFractionDigits: 0
        });

        return formatter.format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: setCurrentCode, convertAndFormat }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
