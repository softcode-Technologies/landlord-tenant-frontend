import apiClient from "./client"
import type { Review } from "@/lib/types"

type ReviewSubjectType = "landlord" | "tenant" | "property" | "agent"

export const reviewsApi = {
  getReviewsBySubject: (subjectType: ReviewSubjectType, subjectId: string) =>
    apiClient.get<{ reviews: Review[]; total: number; averageRating: number | null }>(
      `/reviews/subject/${subjectType}/${subjectId}`
    ),

  createReview: (data: {
    tenancyId: string
    subjectType: ReviewSubjectType
    subjectId: string
    rating: number
    comment?: string
  }) => apiClient.post<Review>("/reviews", data),

  replyToReview: (id: string, reply: string) =>
    apiClient.patch(`/reviews/${id}/reply`, { reply }),
}
