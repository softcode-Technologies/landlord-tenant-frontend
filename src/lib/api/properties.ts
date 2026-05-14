import apiClient from "./client"
import type { Property, Unit } from "@/lib/types"

export interface CreateUnitData {
  propertyId: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  toilets?: number
  rentPerAnnum: number
}

export const propertiesApi = {
  getProperties: () => apiClient.get<Property[]>("/properties"),

  getProperty: (id: string) => apiClient.get<Property>(`/properties/${id}`),

  createProperty: (data: Partial<Property>) =>
    apiClient.post<Property>("/properties", data),

  updateProperty: (id: string, data: Partial<Property>) =>
    apiClient.patch<Property>(`/properties/${id}`, data),

  deleteProperty: (id: string) => apiClient.delete(`/properties/${id}`),

  uploadImages: (id: string, formData: FormData) =>
    apiClient.post<Property>(`/properties/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  createUnit: (data: CreateUnitData) =>
    apiClient.post<Unit>(`/properties/${data.propertyId}/units`, data),

  updateUnit: (id: string, data: Partial<Unit>) =>
    apiClient.patch<Unit>(`/units/${id}`, data),

  deactivateUnit: (id: string) => apiClient.delete(`/units/${id}`),
}
