const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiBase = {
  async request(endpoint: string, options: RequestInit = {}) {
    // ... implementation same as before but using internal references
    const token = localStorage.getItem("token");
    const headers: any = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Only set default Content-Type if we're not sending FormData
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const isAdminEndpoint = endpoint.startsWith("/admin") || endpoint.includes("/admin/");
      const isAdminLoggedIn = localStorage.getItem("admin_logged_in") === "true";
      
      // If admin is logged in but hits a 401 on a NON-admin endpoint, don't log them out of admin panel
      if (isAdminLoggedIn && !isAdminEndpoint) {
        return Promise.reject(new Error("Unauthorized for user endpoint (Admin session active)"));
      }

      localStorage.removeItem("token");
      
      if (isAdminEndpoint) {
        localStorage.removeItem("admin_logged_in");
        window.dispatchEvent(new Event("admin_session_expired"));
      } else {
        localStorage.removeItem("userRole");
        window.dispatchEvent(new Event("session_expired"));
      }
      return Promise.reject(new Error("Session expired. Please login again."));
    }
    if (response.status === 403) {
      return Promise.reject(new Error("Access forbidden."));
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = "An error occurred";
      
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
        errorMessage = errorData.detail.message || errorData.detail.error || JSON.stringify(errorData.detail);
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async get(endpoint: string) {
    return apiBase.request(endpoint);
  },

  async post(endpoint: string, body: any) {
    return apiBase.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  auth: {
    async login(formData: FormData) {
      // Use URLSearchParams to ensure content-type is application/x-www-form-urlencoded
      const params = new URLSearchParams();
      formData.forEach((value, key) => {
        params.append(key, value.toString());
      });

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userRole", data.role || "student");
      return data;
    },

    async register(userData: any, role: string = "student", teacherData?: any) {
      return apiBase.request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...userData,
          role,
          teacher_data: teacherData,
        }),
      });
    },

    logout() {
      localStorage.removeItem("token");
    }
  },

  users: {
    async getMe() {
      return apiBase.request("/users/me");
    },
    async updateProfile(data: any) {
      return apiBase.request("/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    async subscribe(plan: string) {
      return apiBase.request(`/users/subscribe/${plan}`, {
        method: "POST"
      });
    }
  },
};


const cleanParamObject = (params: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([_, v]) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      v !== "undefined" &&
      v !== "null"
    )
  );
};

export interface TopRecommendedScholarship {
  id: number;
  title: string;
  university_name: string;
  country: string;
  degree_level: string;
  fit_score: number;
  eligibility: "eligible" | "borderline" | "not_eligible";
  short_reason: string;
  is_strong_match: boolean;
  deadline?: string;
  after_fee?: number;
  amount?: string;
  match_label?: string;
}

export interface AIRecommendationResponse {
  user_id: number;
  recommended_next_degree: string;
  reason_next_degree: string;
  top_scholarships: TopRecommendedScholarship[];
  ml_active: boolean;
}

export interface ScholarshipRecommendation {
  id: number;
  title: string;
  university_name: string;
  country: string;
  degree_level: string;
  fit_score: number;
  eligibility: "eligible" | "borderline" | "not_eligible";
  reasons: string[];
}

export interface RecommendationResponse {
  user_id: number;
  recommended_next_degree: string;
  reason_next_degree: string;
  items: ScholarshipRecommendation[];
}

/** New unified recommendation item returned by GET /recommendations/profile */
export interface RecommendationItem {
  scholarship_id: number;
  scholarship_name: string;
  uni_name: string;
  country: string;
  city: string;
  fit_score: number;
  match_label: "High Match" | "Good Match" | "Stretch";
  match_color: "green" | "yellow" | "red";
  reasons: string[];
  scholarship_link: string;
  after_fee: number;
  cgpa_min: number;
  deadline: string;
}

export interface ProfileRecommendationResponse {
  user_id: number;
  items: RecommendationItem[];
  ml_active: boolean;
}

export const api = {
  ...apiBase,
  scholarships: {
    async list(params: Record<string, any> = {}) {
      if (!params.limit) params.limit = '100';
      const query = new URLSearchParams(cleanParamObject(params)).toString();
      return apiBase.request(`/scholarships/?${query}`);
    },
    async get(id: number) {
      return apiBase.request(`/scholarships/${id}`);
    },
    async getCities(country: string) {
      return apiBase.request(`/scholarships/filters/cities?country=${country}`);
    },
    async getCountries() {
      return apiBase.request(`/scholarships/filters/countries`);
    },
    async getFields() {
      return apiBase.request(`/scholarships/filters/fields`);
    },
    async getLevels() {
      return apiBase.request(`/scholarships/filters/levels`);
    },
    async getStats() {
      return apiBase.request(`/scholarships/stats`);
    },
    async getUniversities(params: Record<string, any> = {}) {
      const query = new URLSearchParams(cleanParamObject(params)).toString();
      return apiBase.request(`/scholarships/universities?${query}`);
    },
    async getUniversityDetails(id: number) {
      return apiBase.request(`/scholarships/universities/${id}`);
    },
    async getUniversityByName(name: string) {
      return apiBase.request(`/scholarships/universities/by-name/${name}`);
    },
    async smartSearch(query: string, user_cgpa?: number) {
      const gpaParam = user_cgpa ? `&user_cgpa=${user_cgpa}` : "";
      return apiBase.request(`/scholarships/smart-search?q=${encodeURIComponent(query)}${gpaParam}`);
    }
  },

  dashboard: {
    async getSummary() {
      return apiBase.request("/dashboard/summary");
    },
    async getSaved() {
      return apiBase.request("/dashboard/saved");
    },
    async save(id: number) {
      return apiBase.request(`/dashboard/save/${id}`, { method: "POST" });
    },
    async unsave(id: number) {
      return apiBase.request(`/dashboard/unsave/${id}`, { method: "DELETE" });
    }
  },

  recommendations: {
    async list(params: Record<string, any> = {}) {
      const query = new URLSearchParams(cleanParamObject(params)).toString();
      return apiBase.request(`/recommendations/?${query}`);
    },
    async getProfileRecommendations(): Promise<RecommendationResponse> {
      return apiBase.request("/recommendations/profile");
    },
    async getProfile(): Promise<ProfileRecommendationResponse> {
      return apiBase.request("/recommendations/profile");
    },
    async submitFeedback(scholarshipId: number, action: "view" | "save" | "apply"): Promise<void> {
      return apiBase.request("/recommendations/feedback", {
        method: "POST",
        body: JSON.stringify({ scholarship_id: scholarshipId, action }),
      });
    },
  },

  chatbot: {
    async sendMessage(message: string, file?: File) {
      if (file) {
        const formData = new FormData();
        formData.append("message", message);
        formData.append("file", file);

        // Use fetch directly for FormData to avoid default JSON headers in apiBase.request
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/chat/`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "An error occurred");
        }
        return response.json();
      }

      // Default to Form data even for text-only to match the updated backend Form(...) requirements
      const formData = new FormData();
      formData.append("message", message);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "An error occurred");
      }
      return response.json();
    },
    async getHistory(mode: string = "student") {
      return apiBase.request(`/api/chat/history?mode=${mode}`);
    },
    async getAdminHistory() {
      return apiBase.request("/admin/ai-chat/history");
    },
    async sendAdminMessage(message: string) {
      return apiBase.request("/admin/ai-chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
    },
    async sendTeacherMessage(message: string) {
      return apiBase.request("/teacher/ai-chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
    },
  },

  admin: {
    async login(data: any) {
      const result = await apiBase.post("/admin/login", data);
      localStorage.setItem("token", result.access_token);
      return result;
    },
    async getDashboard() {
      return apiBase.request("/admin/dashboard");
    },
    async getUsers() {
      return apiBase.request("/admin/users");
    },
    async deleteUser(userId: number) {
      return apiBase.request(`/admin/users/${userId}`, { method: "DELETE" });
    },
    async getAutoVerifyStats() {
      return apiBase.request("/admin/auto-verify/stats");
    },
    async getAutoVerifyLog(limit: number = 100) {
      return apiBase.request(`/admin/auto-verify/log?limit=${limit}`);
    },
    async runAutoVerify() {
      return apiBase.request("/admin/auto-verify/run", { method: "POST" });
    },
    async overrideStagedDecision(stagedId: number, action: "approve" | "reject") {
      return apiBase.request(`/admin/auto-verify/override/${stagedId}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    },
    async getStagedPending() {
      return apiBase.request("/admin/staged/pending");
    },
    async getScholarships() {
      return apiBase.request("/admin/scholarships");
    },
    async toggleSuspicious(id: number) {
      return apiBase.request(`/admin/scholarships/${id}/flag`, { method: "POST" });
    },
    async getHealth() {
      return apiBase.request("/admin/api-health");
    },
    async getDatabase() {
      return apiBase.request("/admin/database");
    },
    async getAnalytics() {
      return apiBase.request("/admin/analytics");
    },
    async getFraudDashboard() {
      return apiBase.request("/admin/fraud/dashboard");
    },
    async getFlaggedScholarships() {
      return apiBase.request("/admin/fraud/flagged");
    },
    async triggerFraudScan() {
      return apiBase.request("/admin/fraud/scan-now", { method: "POST" });
    },
    async reviewFraud(id: number, action: "approve" | "remove" | "ignore") {
      return apiBase.request(`/admin/fraud/review/${id}`, {
        method: "POST",
        body: JSON.stringify({ action })
      });
    },
    async runPipeline() {
      return apiBase.request("/admin/pipeline/run", { method: "POST" });
    },
    async getPipelineStatus() {
      return apiBase.request("/admin/pipeline/status");
    },
    async getPipelineLogs(page: number = 1, pageSize: number = 10) {
      return apiBase.request(`/admin/pipeline/logs?page=${page}&page_size=${pageSize}`);
    },
    async getPipelineReport(period: "weekly" | "monthly" = "monthly") {
      return apiBase.request(`/admin/pipeline/report?period=${period}`);
    },
    // Auto-Update APIs
    async triggerAutoUpdate(batchSize: number = 15) {
      return apiBase.request(`/admin/auto-update/run?batch_size=${batchSize}`, { method: "POST" });
    },
    async getAutoUpdateLog() {
      return apiBase.request("/admin/auto-update/log");
    },
    async getAutoUpdateStatus() {
      return apiBase.request("/admin/auto-update/status");
    },
    // Expired Scholarship Cleanup
    async getExpiredScholarshipCount() {
      return apiBase.request("/admin/scholarships/expired-count");
    },
    async archiveExpiredScholarships() {
      return apiBase.request("/admin/scholarships/archive-expired", { method: "POST" });
    },
    async getExpiredCleanupLog() {
      return apiBase.request("/admin/scholarships/cleanup-log");
    },
    async getArchivedScholarships(skip = 0, limit = 500) {
      return apiBase.request(`/admin/scholarships/archived?skip=${skip}&limit=${limit}`);
    },
    // Verification APIs
    async getVerificationStats() {
      return apiBase.request("/admin/verification/stats");
    },
    async getPendingVerifications() {
      return apiBase.request("/admin/verification/pending");
    },
    async getScholarshipVerification(id: number) {
      return apiBase.request(`/admin/scholarships/${id}/verification`);
    },
    async updateScholarshipVerification(id: number, data: any) {
      return apiBase.request(`/admin/scholarships/${id}/verify`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    // Teacher Approval APIs
    async getTeachers(status?: string) {
      const query = status ? `?status=${status}` : "";
      return apiBase.request(`/admin/teachers/all${query}`);
    },
    async getPendingTeachers() {
      return apiBase.request("/admin/teachers/pending");
    },
    async getTeacherStats() {
      return apiBase.request("/admin/teachers/stats");
    },
    async approveTeacher(id: number) {
      return apiBase.request(`/admin/teachers/${id}/approve`, { method: "POST" });
    },
    async rejectTeacher(id: number, reason: string) {
      return apiBase.request(`/admin/teachers/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
    }
  },

  applications: {
    async list() {
      return apiBase.request("/applications/");
    },
    async save(scholarshipId: number, status: string = "Saved", notes?: string) {
      return apiBase.request("/applications/", {
        method: "POST",
        body: JSON.stringify({ scholarship_id: scholarshipId, status, notes })
      });
    },
    async update(appId: number, data: { status?: string; notes?: string }) {
      return apiBase.request(`/applications/${appId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(appId: number) {
      return apiBase.request(`/applications/${appId}`, {
        method: "DELETE"
      });
    },
    async getNotifications() {
      return apiBase.request("/applications/notifications");
    }
  },



  consultant: {
    async getStatus() {
      return apiBase.request("/consultant/status");
    },
    async chat(message: string, sessionId?: string) {
      return apiBase.request("/consultant/chat", {
        method: "POST",
        body: JSON.stringify({ message, session_id: sessionId }),
      });
    },
    async getHistory(sessionId: string = "general") {
      return apiBase.request(`/consultant/history?session_id=${sessionId}`);
    },
    async clearHistory() {
      return apiBase.request("/consultant/history", { method: "DELETE" });
    },
    async reviewSop(sopText: string, scholarshipId: number) {
      return apiBase.request("/consultant/review-sop", {
        method: "POST",
        body: JSON.stringify({ sop_text: sopText, scholarship_id: scholarshipId }),
      });
    },
    async draftEmail(universityName: string, purpose: string) {
      return apiBase.request("/consultant/draft-email", {
        method: "POST",
        body: JSON.stringify({ university_name: universityName, purpose }),
      });
    },
    async getVisaGuide(country: string) {
      return apiBase.request("/consultant/visa-guide", {
        method: "POST",
        body: JSON.stringify({ country }),
      });
    },
    async generateMockInterview(scholarshipId: number, questionCount: number = 5) {
      return apiBase.request("/consultant/mock-interview", {
        method: "POST",
        body: JSON.stringify({ scholarship_id: scholarshipId, question_count: questionCount }),
      });
    },
    async getInterviewFeedback(question: string, userAnswer: string) {
      return apiBase.request("/consultant/interview-feedback", {
        method: "POST",
        body: JSON.stringify({ question, user_answer: userAnswer }),
      });
    },
    async getFinancialPlan(country: string, city: string, durationMonths: number) {
      return apiBase.request("/consultant/financial-plan", {
        method: "POST",
        body: JSON.stringify({ country, city, duration_months: durationMonths }),
      });
    },
  },

  sop: {
    async generate(scholarshipId: number, tone: string, wordCount: number) {
      return apiBase.request("/sop/generate", {
        method: "POST",
        body: JSON.stringify({ scholarship_id: scholarshipId, tone, word_count: wordCount }),
      });
    },
    async refine(sopText: string, instruction: string) {
      return apiBase.request("/sop/refine", {
        method: "POST",
        body: JSON.stringify({ sop_text: sopText, instruction }),
      });
    },
  },
  notifications: {
    async list() {
      return apiBase.request("/notifications/");
    },
    async markRead(id: number) {
      return apiBase.request(`/notifications/${id}/read`, { method: "PUT" });
    },
    async testAlert() {
      return apiBase.request("/notifications/test-alert", { method: "POST" });
    }
  },

  teacher: {
    // Profile & Analytics
    async getProfile() {
      return apiBase.request("/teacher/profile");
    },
    async updateProfile(data: any) {
      return apiBase.request("/teacher/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async register(data: any) {
      return apiBase.request("/teacher/register", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async getAnalytics() {
      return apiBase.request("/teacher/analytics");
    },
    
    // Course Management
    async getCourses() {
      return apiBase.request("/teacher/courses");
    },
    async createCourse(data: any) {
      return apiBase.request("/teacher/courses", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async updateCourse(courseId: number, data: any) {
      return apiBase.request(`/teacher/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async deleteCourse(courseId: number) {
      return apiBase.request(`/teacher/courses/${courseId}`, {
        method: "DELETE"
      });
    },
    
    // Lesson Management
    async addLesson(courseId: number, data: any) {
      return apiBase.request(`/teacher/courses/${courseId}/lessons`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async deleteLesson(lessonId: number) {
      return apiBase.request(`/teacher/lessons/${lessonId}`, {
        method: "DELETE"
      });
    },
    
    // Live Classes
    async getLiveClasses(courseId: number) {
      return apiBase.request(`/teacher/courses/${courseId}/live-classes`);
    },
    async scheduleLiveClass(courseId: number, data: any) {
      return apiBase.request(`/teacher/courses/${courseId}/live-classes`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async deleteLiveClass(classId: number) {
      return apiBase.request(`/teacher/live-classes/${classId}`, {
        method: "DELETE"
      });
    },
    
    // Quiz Management
    async getQuizzes(courseId: number) {
      return apiBase.request(`/teacher/courses/${courseId}/quizzes`);
    },
    async createQuiz(courseId: number, data: any) {
      return apiBase.request(`/teacher/courses/${courseId}/quizzes`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async deleteQuiz(quizId: number) {
      return apiBase.request(`/teacher/quizzes/${quizId}`, {
        method: "DELETE"
      });
    },
    async getQuizQuestions(quizId: number) {
      return apiBase.request(`/teacher/quizzes/${quizId}`);
    },
    async addQuizQuestion(quizId: number, data: any) {
      return apiBase.request(`/teacher/quizzes/${quizId}/questions`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    
    // Meeting Links
    async addMeetingLink(courseId: number, data: any) {
      return apiBase.request(`/teacher/courses/${courseId}/meeting-links`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async deleteMeetingLink(linkId: number) {
      return apiBase.request(`/teacher/meeting-links/${linkId}`, {
        method: "DELETE"
      });
    },
    
    // Student Management
    async getStudents() {
      return apiBase.request("/teacher/students");
    },
    
    // Payment Management
    async getPendingPayments() {
      return apiBase.request("/teacher/payments/pending");
    },
    async approvePayment(enrollmentId: number) {
      return apiBase.request(`/teacher/enrollments/${enrollmentId}/approve-payment`, {
        method: "POST"
      });
    },
    async rejectPayment(enrollmentId: number, reason: string) {
      return apiBase.request(`/teacher/enrollments/${enrollmentId}/reject-payment`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
    },
    async uploadProfilePicture(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      return apiBase.request(`/teacher/profile/picture`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type, let browser set it with boundary
        headers: {},
      });
    },
    async removeProfilePicture() {
      return apiBase.request(`/teacher/profile/picture`, {
        method: "DELETE"
      });
    }
  },

  // Student - Browse Teachers
  async getApprovedTeachers(testType?: string) {
    const query = testType ? `?test_type=${testType}` : "";
    return apiBase.request(`/courses/teachers/approved${query}`);
  },
  async getTeacherDetail(teacherId: number) {
    return apiBase.request(`/courses/teachers/${teacherId}`);
  },

  // Student Enrollment & Payments - wrapped in courses object
  courses: {
    async enrollInCourse(courseId: number) {
      return apiBase.request(`/courses/${courseId}/enroll`, {
        method: "POST"
      });
    },
    async submitPayment(courseId: number, data: { payment_method: string; payment_reference: string; amount_paid?: number }) {
      return apiBase.request(`/courses/${courseId}/submit-payment`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async getMyEnrolledCourses() {
      return apiBase.request("/courses/my-enrollments");
    },
    async getCourseDetail(courseId: number) {
      return apiBase.request(`/courses/${courseId}/student-view`);
    },
    async createStripePaymentIntent(courseId: number, amount: number) {
      return apiBase.request("/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, amount }),
      });
    },
    async confirmStripePayment(courseId: number, paymentIntentId: string) {
      return apiBase.request("/payments/confirm", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, payment_intent_id: paymentIntentId }),
      });
    }
  },

  // ─── Teacher Reviews API ────────────────────────────
  teacherReviews: {
    // Submit a review for a teacher (student only)
    async submitReview(teacherId: number, rating: number, reviewText?: string) {
      // Try JSON body first (FastAPI @router.post with Pydantic body)
      // Also send as query params as fallback for Query() style endpoints
      const params = new URLSearchParams({ rating: String(rating) });
      if (reviewText) params.set("review_text", reviewText);
      return apiBase.request(`/teacher-reviews/${teacherId}?${params.toString()}`, {
        method: "POST",
        body: JSON.stringify({ rating, review_text: reviewText || "" }),
      });
    },

    // Get all reviews for a teacher (public)
    async getTeacherReviews(teacherId: number, page: number = 1, perPage: number = 10) {
      return apiBase.request(`/teacher-reviews/${teacherId}?page=${page}&per_page=${perPage}`);
    },

    // Get reviews submitted by current student
    async getMyReviews() {
      return apiBase.request("/teacher-reviews/student/my-reviews");
    },

    // Report a review (teacher only)
    async reportReview(reviewId: number, reason: string) {
      return apiBase.request(`/teacher-reviews/report/${reviewId}?reason=${encodeURIComponent(reason)}`, {
        method: "POST"
      });
    },

    // Get my reported reviews (teacher only)
    async getMyReportedReviews() {
      return apiBase.request("/teacher-reviews/teacher/reported");
    },

    // Admin: Get all reported reviews
    async adminGetReportedReviews() {
      return apiBase.request("/teacher-reviews/admin/reported");
    },

    // Admin: Remove a review
    async adminRemoveReview(reviewId: number, reason: string) {
      return apiBase.request(`/teacher-reviews/admin/remove/${reviewId}?reason=${encodeURIComponent(reason)}`, {
        method: "POST"
      });
    },

    // Admin: Dismiss a report
    async adminDismissReport(reviewId: number, notes?: string) {
      const query = notes ? `?notes=${encodeURIComponent(notes)}` : "";
      return apiBase.request(`/teacher-reviews/admin/dismiss/${reviewId}${query}`, {
        method: "POST"
      });
    },

    // Admin: Get all reviews
    async adminGetAllReviews(page: number = 1, perPage: number = 20) {
      return apiBase.request(`/teacher-reviews/admin/all-reviews?page=${page}&per_page=${perPage}`);
    }
  }
};

