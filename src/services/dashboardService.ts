import { dashboardResponseDTO } from "../types/dashboardResponseDTO";
import api from "./api";

export const dashboardService = { 
 
 async getDashboardData(): Promise<dashboardResponseDTO> {
    const response = await api.get('/api/Application/v1/GetDashboardData', {
    });
    return response.data;
  },
}