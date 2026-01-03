import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Parse a receipt image to extract transaction details
export const parseReceiptImage = async (base64Image: string): Promise<Partial<Transaction> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Extract the total amount, date, merchant name, and best fitting category from this receipt. Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            merchant: { type: Type.STRING },
            date: { type: Type.STRING, description: "ISO 8601 date format if found, otherwise today's date" },
            category: { type: Type.STRING, description: "One of: Food & Dining, Transportation, Shopping, Bills & Utilities, Entertainment, Health & Fitness, Other" },
            note: { type: Type.STRING, description: "Short description of items" }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        amount: data.amount,
        category: data.category || 'Other',
        date: data.date || new Date().toISOString(),
        note: data.merchant ? (data.note ? `${data.merchant} - ${data.note}` : data.merchant) : (data.note || 'Receipt Entry'),
        type: TransactionType.EXPENSE
      };
    }
    return null;
  } catch (error) {
    console.error("Gemini Receipt Parsing Error:", error);
    throw new Error("Failed to parse receipt. Please try again.");
  }
};

// Analyze spending habits
export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  try {
    // Limit to last 50 transactions to save tokens/context
    const recent = transactions.slice(0, 50);
    const summary = JSON.stringify(recent);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a financial advisor. Analyze these recent transactions (JSON format): ${summary}. 
      
      Provide 3 short, actionable bullet points about my spending habits. 
      Be encouraging but realistic. 
      Focus on where I can save money or if I'm doing a good job. 
      Do not use markdown formatting like bolding, just plain text with emojis.`,
    });

    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Unable to connect to AI advisor. Please check your connection.";
  }
};