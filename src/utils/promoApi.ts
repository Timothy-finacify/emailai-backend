// src/api/promoApi.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export interface PromoData {
  code: string
  discountPercent: number
  freeMonths: number
  appliedAt: string
  source: string
  referrerId?: string
}

// Save promo to backend when user signs up
export const savePromoToBackend = async (userId: string, promoData: PromoData): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/promo/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        userId,
        promoCode: promoData.code,
        discountPercent: promoData.discountPercent,
        freeMonths: promoData.freeMonths,
        source: promoData.source,
        referrerId: promoData.referrerId || null,
        appliedAt: promoData.appliedAt,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save promo data')
    }

    const data = await response.json()
    console.log('Promo saved to backend:', data)
    return data
  } catch (error) {
    console.error('Error saving promo to backend:', error)
  }
}

// Get promo data for a user
export const getUserPromoData = async (userId: string): Promise<PromoData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/promo/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching promo data:', error)
    return null
  }
}

// Generate unique referral code for user
export const generateReferralCode = async (userId: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/promo/generate-referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate referral code')
    }

    const data = await response.json()
    return data.referralCode
  } catch (error) {
    console.error('Error generating referral code:', error)
    return `REF-${userId.substring(0, 8)}`
  }
}