export interface CreateCheckoutParams {
  userId: string
  priceId: string
  planName: string
  currency: 'USD' | 'CNY'
  locale: 'en' | 'zh'
  durationType: 'monthly' | 'yearly'
  returnUrl: string
}

export interface CreateCheckoutResult {
  sessionId: string
  url: string
  amount?: number
  currency?: 'USD' | 'CNY'
}

export interface RefundParams {
  paymentId: string
  amount?: number
  reason?: string
}

export interface PaymentProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>
  refund(params: RefundParams): Promise<{ success: boolean }>
  verifyWebhookSignature(rawBody: string, signature: string): boolean
  parseWebhookEvent(body: unknown): { type: string; id: string; data: any }
}

export type ProviderName = 'stripe' | 'creem'
