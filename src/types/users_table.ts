interface HttpResponseDTO {
  status: number;
  message: string;
}

export interface GetRequestDTO {
  tableName: string; //users
  condition?: string | null;
}

export interface GetResponseDTO {
  response: HttpResponseDTO;
  result?: Array<Record<string, any>> | null;
}