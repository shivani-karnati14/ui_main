import type {
  UploadCardResponse,
  ScheduleMeetingResponse,
  EmailDraftResponse,
  UserInfo,
  LLMResponse,
} from '../types/cardScanner';

/**
 * Prefer explicit backend during development; fall back to localhost.
 * In production, use VITE_BACKEND_URL or a hosted default.
 */
const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000')
  : (import.meta.env.VITE_BACKEND_URL || 'https://syndy-aiagent-be-poc.onrender.com');

function isJsonString(s: string) {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

/** Central response handler to reduce repetition */
async function handleResponse(response: Response) {
  const text = await response.text();
  if (!response.ok) {
    // Log full body for easier debugging in dev
    console.error('🚨 Backend error response:', response.status, text);
    if (isJsonString(text)) {
      const json = JSON.parse(text);
      const detail = json.detail || json.message || JSON.stringify(json);
      throw new Error(detail || `Request failed: ${response.status}`);
    }
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return null;
}

/** Normalize a raw getCardData response into a predictable shape used by the UI */
function normalizeCardData(raw: any) {
  if (!raw) return {
    record_id: null,
    image_url: null,
    structured_data: {},
    company_data: {},
    llm_response: raw?.llm_response || null,
    created_at: raw?.created_at || null,
    processed_at: raw?.processed_at || null,
    is_meeting_requested: raw?.is_meeting_requested || false,
  };

  // Different backends may return fields in slightly different places.
  const structured = raw.structured_data || raw.llm_response?.extracted_data || raw.structured || {};
  const company = raw.company_data || raw.structured_data?.company_data || raw.additional_info?.company_data || {};
  return {
    record_id: raw.record_id || raw.transactionID || raw.transaction_id || null,
    image_url: raw.image_url || raw.image || raw.imageUrl || null,
    structured_data: structured,
    company_data: company,
    llm_response: raw.llm_response || (raw.llm_response ? raw.llm_response : null),
    created_at: raw.created_at || raw.createdAt || null,
    processed_at: raw.processed_at || raw.processedAt || null,
    is_meeting_requested: raw.is_meeting_requested || raw.isMeetingRequested || false,
    raw,
  };
}

// BusinessCardData interface for compatibility in checkProcessingStatus
export interface BusinessCardData {
  transaction_id: string;
  image_url: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  llm_response: LLMResponse | null;
  created_at?: string;
  processed_at?: string | null;
}

export class CardScannerAPI {
  /**
   * Ping endpoint to check backend availability
   * Returns true if backend is reachable, false otherwise
   */
  static async pingBackend(timeoutMs = 5000): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/ping`;
      console.log('🏓 Pinging backend:', url);
      const response = await fetch(url, {
        method: 'GET',
        signal: (AbortSignal as any).timeout ? AbortSignal.timeout(timeoutMs) : undefined,
      });
      const reachable = response.ok;
      console.log(reachable ? '✅ Backend is reachable' : `❌ Backend returned ${response.status}`);
      return reachable;
    } catch (error) {
      console.error('❌ Backend is not reachable:', error);
      return false;
    }
  }

  /**
   * Health check endpoint - detailed backend status
   */
  static async healthCheck(): Promise<any> {
    try {
      const url = `${API_BASE_URL}/health`;
      console.log('🏥 Checking backend health:', url);
      const response = await fetch(url, {
        method: 'GET',
        signal: (AbortSignal as any).timeout ? AbortSignal.timeout(5000) : undefined,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * API 1: Process business card image with AI Vision
   * POST /ai-business-card
   */
  static async uploadCard(imageFile: File): Promise<UploadCardResponse> {
    if (!imageFile) throw new Error('No file provided');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WEBP image.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      throw new Error('File size exceeds 10MB limit.');
    }

    const formData = new FormData();
    formData.append('file', imageFile, imageFile.name);

    console.log('📤 Uploading card image:', imageFile.name, imageFile.type, `${(imageFile.size / 1024).toFixed(2)}KB`);

    // Quick reachability check to fail fast when backend is down
    try {
      const backendReachable = await this.pingBackend(3000);
      if (!backendReachable) {
        throw new Error('Backend not reachable. Please check backend URL or network.');
      }
    } catch (err) {
      console.warn('⚠️ Ping check failed prior to upload:', err);
      throw err;
    }

    // Prefer the namespaced API endpoint if available, fall back to legacy ai-business-card
    const preferredUrl = `${API_BASE_URL}/api/uploadBusinessCard`;
    const legacyUrl = `${API_BASE_URL}/ai-business-card`;

    let result: any = null;
    try {
      console.log(`➡️ Attempting upload to preferred endpoint: ${preferredUrl}`);
      const resp = await fetch(preferredUrl, { method: 'POST', body: formData });
      result = await handleResponse(resp);
    } catch (err) {
      console.warn('⚠️ Preferred upload endpoint failed, falling back to legacy endpoint:', err);
      try {
        console.log(`➡️ Falling back to legacy endpoint: ${legacyUrl}`);
        const resp2 = await fetch(legacyUrl, { method: 'POST', body: formData });
        result = await handleResponse(resp2);
      } catch (err2) {
        console.error('❌ Both upload endpoints failed:', err2);
        // Re-throw original error message for UI
        throw err2;
      }
    }

    // Map backend record_id to transactionID for consistency with frontend
    const transactionID =
      result?.record_id || result?.transactionID || `txn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    // Return a minimal compatibility object; cast via unknown to satisfy TS when backend response shape varies
    return {
      status: 200,
      message: 'User Card Image is stored and being processed',
      transactionID,
      aiResponse: result,
      // Provide a few compatibility fields expected by consumers
      success: true,
      filename: result?.filename || result?.file_name || imageFile.name,
      method: 'upload',
      structured_data: result?.structured_data || result?.llm_response || {},
      confidence: result?.confidence || 0,
      qr_codes: result?.qr_codes || [],
      qr_count: result?.qr_count || 0,
      formatted_output: result?.formatted_output || JSON.stringify(result || {}),
      raw_analysis: result?.raw_analysis || JSON.stringify(result || {}),
      additional_info: result?.additional_info || {},
      saved_to_database: !!result?.saved_to_database,
      database_available: !!result?.database_available,
      record_id: result?.record_id || transactionID,
    } as unknown as UploadCardResponse;
  }

  /**
   * API 2: Get complete card data including company enrichment
   * GET /api/getCardData/{record_id}
   */
  static async getCardData(recordId: string): Promise<any> {
    if (!recordId) throw new Error('No record ID provided');
    const encodedId = encodeURIComponent(recordId);
    const url = `${API_BASE_URL}/api/getCardData/${encodedId}`;
    console.log('📥 Fetching complete card data for record:', recordId);

    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const raw = await handleResponse(response);
    const normalized = normalizeCardData(raw);
    console.log('🔧 Normalized card data keys:', Object.keys(normalized));
    return normalized;
  }

  /**
   * API 3: Record audio and convert to text without avatar
   * POST /api/recordAudiowithoutAvatar
   */
  static async recordAudio(audioBlob: Blob): Promise<{ status: number; message: string; transcript: string; record_id: string }> {
    if (!audioBlob) throw new Error('No audio blob provided');
    console.log('🎤 Recording audio for transcription:', audioBlob.size, 'bytes');

    const response = await fetch(`${API_BASE_URL}/api/recordAudiowithoutAvatar`, {
      method: 'POST',
      headers: {
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    });

    return await handleResponse(response);
  }

  /**
   * API 4: Get selfie URL for a record
   * GET /api/getSelfieUrl/{record_id}
   */
  static async getSelfieUrl(recordId: string): Promise<{ status: number; record_id: string; selfie_url: string | null; selfie_exists: boolean; selfie_info: any }> {
    if (!recordId) throw new Error('No record ID provided');
    const encodedId = encodeURIComponent(recordId);
    const url = `${API_BASE_URL}/api/getSelfieUrl/${encodedId}`;
    console.log('📸 Getting selfie URL for record:', recordId);

    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    return await handleResponse(response);
  }

  /**
   * API 5: Upload selfie image
   * POST /api/uploadSelfie?record_id={...}
   */
  static async uploadSelfie(recordId: string, selfieFile: File): Promise<{ status: number; message: string; record_id: string; selfie_url: string }> {
    if (!selfieFile) throw new Error('No selfie file provided');
    if (!recordId) throw new Error('No record ID provided');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selfieFile.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WEBP image.');
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selfieFile.size > maxSize) throw new Error('File size exceeds 10MB limit.');

    const formData = new FormData();
    formData.append('file', selfieFile);

    const url = `${API_BASE_URL}/api/uploadSelfie?record_id=${encodeURIComponent(recordId)}`;
    console.log('📤 Uploading selfie:', selfieFile.name, selfieFile.type, `${(selfieFile.size / 1024).toFixed(2)}KB`);
    console.log('📋 Record ID:', recordId);

    const response = await fetch(url, { method: 'POST', body: formData });
    return await handleResponse(response);
  }

  /**
   * API 6: Generate email draft using LLM
   * POST /api/generateEmailDraft/{record_id}
   */
  static async generateEmailDraft(
    recordId: string,
    options?: { notes?: string; audio_transcript?: string; email?: string; email_draft?: string | object }
  ): Promise<any> {
    if (!recordId) throw new Error('No record ID provided');

    const requestBody: any = {};
    if (options?.notes) requestBody.notes = options.notes;
    if (options?.audio_transcript) requestBody.audio_transcript = options.audio_transcript;
    if (options?.email) requestBody.email = options.email;
    if (options?.email_draft) requestBody.email_draft = options.email_draft;

    const url = `${API_BASE_URL}/api/generateEmailDraft/${encodeURIComponent(recordId)}`;
    console.log('📧 Generating email draft for record:', recordId);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  }

  /**
   * API 7: Summarize chat history
   * POST /api/summarizeChatHistory/{record_id}
   */
  static async summarizeChatHistory(recordId: string): Promise<any> {
    if (!recordId) throw new Error('No record ID provided');

    const url = `${API_BASE_URL}/api/summarizeChatHistory/${encodeURIComponent(recordId)}`;
    console.log('📝 Summarizing chat history for record:', recordId);

    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    return await handleResponse(response);
  }

  /**
   * Keep existing project features
   */

  // Schedule meeting (kept; endpoint unchanged)
  static async scheduleMeeting(
    transactionID: string,
    includeSelfie: boolean = false,
    emailDraft?: { to: string; subject: string; body: string }
  ): Promise<ScheduleMeetingResponse> {
    console.log('📅 Scheduling meeting:', { transactionID, includeSelfie, emailDraft });

    const response = await fetch(`${API_BASE_URL}/api/intiateMeetingScheduler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record_id: transactionID, // Backend expects 'record_id'
        isMeetingRequested: true,
        includeSelfie,
        ...(emailDraft && {
          email_draft: {
            to: emailDraft.to,
            subject: emailDraft.subject,
            body: emailDraft.body,
          },
        }),
      }),
    });

    return await handleResponse(response);
  }

  // Save email draft (kept; uses same endpoint as generate for persistence)
  static async saveEmailDraft(
    transactionID: string,
    emailDraft: { to: string; subject: string; body: string }
  ): Promise<{ success: boolean; message: string }> {
    console.log('📧 Saving email draft:', { transactionID, emailDraft });

    const response = await fetch(`${API_BASE_URL}/api/generateEmailDraft/${encodeURIComponent(transactionID)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_draft: {
          to: emailDraft.to,
          subject: emailDraft.subject,
          body: emailDraft.body,
        },
      }),
    });

    return await handleResponse(response);
  }

  // Derive a simple processing status from getCardData
  static async checkProcessingStatus(transactionID: string): Promise<BusinessCardData> {
    const cardData = await this.getCardData(transactionID);

    // Determine whether company enrichment has completed by checking for common company fields
    const hasCompany = !!(
      cardData.company_data && Object.keys(cardData.company_data).length > 0
    ) || !!(
      cardData.structured_data && (
        cardData.structured_data.company_description || cardData.structured_data.industry || cardData.structured_data.num_of_employees
      )
    );

    return {
      transaction_id: transactionID,
      image_url: cardData.image_url || null,
      processing_status: hasCompany ? 'completed' : 'processing',
      llm_response: cardData.llm_response || null,
      created_at: cardData.created_at,
      processed_at: cardData.processed_at || (hasCompany ? new Date().toISOString() : null),
    };
    }

  // Extract user info from card data
  static async getUserInfo(transactionID: string): Promise<UserInfo> {
    try {
      const cardData = await this.getCardData(transactionID);
      const extractedData = cardData.structured_data || cardData.llm_response?.extracted_data || {};
      return {
        transactionID,
        email: extractedData.email || null,
        name: extractedData.name || null,
        phone: extractedData.phone || null,
        company: extractedData.company || null,
        is_meeting_requested: cardData.is_meeting_requested || false,
        created_at: cardData.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to fetch user info:', error);
      return {
        transactionID,
        email: null,
        name: null,
        phone: null,
        company: null,
        is_meeting_requested: false,
        created_at: new Date().toISOString(),
      };
    }
  }
}