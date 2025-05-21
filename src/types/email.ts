export interface EmailRequestDTO {
  To: string[];
  Cc?: string[];
  Bcc?: string[];
  Attachments?: FileRequestDTO[];
  Subject: string;
  Body: string;
  IsHtml: boolean;
}

export interface FileRequestDTO {
  FileName: string;
  ContentBase64: string;
}

export interface EmailResponseDTO {
  Success: boolean;
  Message: string;
  FailedRecipients?: string[];
}
