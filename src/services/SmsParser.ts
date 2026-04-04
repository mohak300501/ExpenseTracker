import { Transaction } from '../database/db';

export const parseSms = (address: string, body: string, dateMs: number): Transaction | null => {
    try {
        const lowerBody = body.toLowerCase();
        
        // 1. Check if it's a bank message (rough check)
        if (!lowerBody.includes('credited') && !lowerBody.includes('debited')) {
            return null;
        }

        const isCredit = lowerBody.includes('credited');
        const type = isCredit ? 'CREDIT' : 'DEBIT';

        // 2. Extract amount: INR or Rs. followed by amount
        const amountRegex = /(?:inr|rs\.?)\s*([\d,]+\.?\d*)/i;
        const amountMatch = body.match(amountRegex);
        if (!amountMatch) return null;
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

        // 3. Extract Account Number: XXNNNN or XNNNN at start of body roughly
        const accountRegex = /(?:[xX*]{1,5})(\d{3,5})/;
        const accountMatch = body.match(accountRegex);
        const account_number = accountMatch ? `XX${accountMatch[1]}` : 'Unknown';

        // 4. Bank name: from address (e.g. VK-HDFCBK) or string end
        let bank_name = address;
        if (bank_name.includes('-')) {
            bank_name = bank_name.split('-')[1];
        } else if (bank_name.length <= 9 && bank_name.match(/^[A-Z]{2}/)) {
            // Usually TRAI format has first two characters as operator code (e.g., AD-SBI)
            bank_name = bank_name.substring(2);
        }
        
        // Unique ID based on content to prevent duplicates using math random or simple hash
        const id = `txn_${dateMs}_${Math.floor(amount)}_${account_number}`;

        return {
            id,
            bank_name,
            account_number,
            type,
            amount,
            date: dateMs,
            raw_message: body
        };
    } catch (e) {
        console.error("Failed to parse SMS", e);
        return null;
    }
};
