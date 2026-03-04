/**
 * Standardized error codes for BagiBerkah API
 */

export enum ErrorCode {
  // General errors (1000-1099)
  INTERNAL_SERVER_ERROR = 'ERR_1000',
  VALIDATION_ERROR = 'ERR_1001',
  NOT_FOUND = 'ERR_1002',
  UNAUTHORIZED = 'ERR_1003',
  FORBIDDEN = 'ERR_1004',
  BAD_REQUEST = 'ERR_1005',
  
  // Envelope errors (2000-2099)
  ENVELOPE_NOT_FOUND = 'ERR_2000',
  ENVELOPE_ALREADY_PAID = 'ERR_2001',
  ENVELOPE_EXPIRED = 'ERR_2002',
  ENVELOPE_BUDGET_MISMATCH = 'ERR_2003',
  ENVELOPE_INVALID_STATUS = 'ERR_2004',
  
  // Claim errors (3000-3099)
  CLAIM_NOT_FOUND = 'ERR_3000',
  CLAIM_EXPIRED = 'ERR_3001',
  CLAIM_ALREADY_PROCESSED = 'ERR_3002',
  CLAIM_INVALID_TOKEN = 'ERR_3003',
  CLAIM_QR_INVALID = 'ERR_3004',
  CLAIM_QR_ALREADY_USED = 'ERR_3005',
  
  // Payment errors (4000-4099)
  PAYMENT_NOT_FOUND = 'ERR_4000',
  PAYMENT_FAILED = 'ERR_4001',
  PAYMENT_EXPIRED = 'ERR_4002',
  PAYMENT_ALREADY_COMPLETED = 'ERR_4003',
  PAYMENT_GATEWAY_ERROR = 'ERR_4004',
  PAYMENT_WEBHOOK_INVALID = 'ERR_4005',
  
  // Disbursement errors (5000-5099)
  DISBURSEMENT_FAILED = 'ERR_5000',
  DISBURSEMENT_INVALID_BANK = 'ERR_5001',
  DISBURSEMENT_INVALID_ACCOUNT = 'ERR_5002',
  
  // AI errors (6000-6099)
  AI_SERVICE_ERROR = 'ERR_6000',
  AI_ALLOCATION_FAILED = 'ERR_6001',
  AI_GREETING_FAILED = 'ERR_6002',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // General
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Terjadi kesalahan pada server',
  [ErrorCode.VALIDATION_ERROR]: 'Data yang dikirim tidak valid',
  [ErrorCode.NOT_FOUND]: 'Data tidak ditemukan',
  [ErrorCode.UNAUTHORIZED]: 'Akses tidak diizinkan',
  [ErrorCode.FORBIDDEN]: 'Anda tidak memiliki akses',
  [ErrorCode.BAD_REQUEST]: 'Permintaan tidak valid',
  
  // Envelope
  [ErrorCode.ENVELOPE_NOT_FOUND]: 'Amplop tidak ditemukan',
  [ErrorCode.ENVELOPE_ALREADY_PAID]: 'Amplop sudah dibayar',
  [ErrorCode.ENVELOPE_EXPIRED]: 'Amplop sudah kadaluarsa',
  [ErrorCode.ENVELOPE_BUDGET_MISMATCH]: 'Total alokasi tidak sesuai dengan budget',
  [ErrorCode.ENVELOPE_INVALID_STATUS]: 'Status amplop tidak valid',
  
  // Claim
  [ErrorCode.CLAIM_NOT_FOUND]: 'Klaim tidak ditemukan',
  [ErrorCode.CLAIM_EXPIRED]: 'Klaim sudah kadaluarsa',
  [ErrorCode.CLAIM_ALREADY_PROCESSED]: 'Klaim sudah diproses',
  [ErrorCode.CLAIM_INVALID_TOKEN]: 'Token klaim tidak valid',
  [ErrorCode.CLAIM_QR_INVALID]: 'QR code tidak valid',
  [ErrorCode.CLAIM_QR_ALREADY_USED]: 'QR code sudah digunakan',
  
  // Payment
  [ErrorCode.PAYMENT_NOT_FOUND]: 'Pembayaran tidak ditemukan',
  [ErrorCode.PAYMENT_FAILED]: 'Pembayaran gagal',
  [ErrorCode.PAYMENT_EXPIRED]: 'Pembayaran sudah kadaluarsa',
  [ErrorCode.PAYMENT_ALREADY_COMPLETED]: 'Pembayaran sudah selesai',
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 'Terjadi kesalahan pada payment gateway',
  [ErrorCode.PAYMENT_WEBHOOK_INVALID]: 'Webhook signature tidak valid',
  
  // Disbursement
  [ErrorCode.DISBURSEMENT_FAILED]: 'Transfer gagal',
  [ErrorCode.DISBURSEMENT_INVALID_BANK]: 'Bank tidak valid',
  [ErrorCode.DISBURSEMENT_INVALID_ACCOUNT]: 'Nomor rekening tidak valid',
  
  // AI
  [ErrorCode.AI_SERVICE_ERROR]: 'Terjadi kesalahan pada AI service',
  [ErrorCode.AI_ALLOCATION_FAILED]: 'Gagal membuat rekomendasi alokasi',
  [ErrorCode.AI_GREETING_FAILED]: 'Gagal membuat greeting',
};
