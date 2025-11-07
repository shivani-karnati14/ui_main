export interface UploadCardResponse {
  success: boolean;
  filename: string;
  method: string;
  structured_data: any;
  confidence: number;
  qr_codes: any[];
  qr_count: number;
  formatted_output: string;
  raw_analysis: string;
  additional_info: any;
  saved_to_database: boolean;
  database_available: boolean;
  record_id: string;
  error?: string;
  // Compatibility properties for CardScannerApp
  transactionID?: string;
  aiResponse?: any;
}

export interface ScheduleMeetingResponse {
  status: number;
  message: string;
  record_id: string;
  transactionID: string;
}

export interface EmailDraftResponse {
  success: boolean;
  record_id: string;
  email_draft?: {
    subject?: string;
    body?: string;
    greeting?: string;
    summary?: string;
  };
  email_subject?: string;
  email_body?: string;
  email_greeting?: string;
  email_summary?: string;
  context_used?: {
    business_card_summary: boolean;
    company_summary: boolean;
    notes: boolean;
    audio_transcript: boolean;
  };
}

export interface UserInfo {
  transactionID: string; // Unified naming: same as record_id from backend, mapped to transactionID
  email: string | null;
  name: string | null;
  phone: string | null;
  company: string | null;
  is_meeting_requested: boolean;
  created_at?: string;
}

// export interface BusinessCardData {
//   transaction_id: string;
//   image_url: string | null;
//   processing_status: 'pending' | 'processing' | 'completed' | 'failed';
//   llm_response: LLMResponse | null;
//   created_at?: string;
//   processed_at?: string | null;
// }

export interface LLMResponse {
  extracted_data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    address?: string;
    [key: string]: any;
  };
}
