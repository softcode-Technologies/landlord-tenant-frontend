import apiClient from "./client"
import type { Review } from "@/lib/types"

export const reviewsApi = {
  getReviewsBySubject: (subjectType: "landlord" | "tenant" | "property", subjectId: string) =>
    apiClient.get<{ reviews: Review[]; total: number; averageRating: number | null }>(
      `/reviews/subject/${subjectType}/${subjectId}`
    ),

  createReview: (data: {
    tenancyId: string
    subjectType: "landlord" | "tenant" | "property"
    subjectId: string
    rating: number
    comment?: string
  }) => apiClient.post<Review>("/reviews", data),

  replyToReview: (id: string, reply: string) =>
    apiClient.patch(`/reviews/${id}/reply`, { reply }),
}
