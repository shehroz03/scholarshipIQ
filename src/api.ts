const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiBase = {
  async request(endpoint: string, options: RequestInit = {}) {
    // ... implementation same as before but using internal references
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "An error occurred");
    }

    return response.json();
  },

  auth: {
    async login(formData: FormData) {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      return data;
    },

    async register(userData: any) {
      return apiBase.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
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
}

export interface AIRecommendationResponse {
  user_id: number;
  recommended_next_degree: string;
  reason_next_degree: string;
  top_scholarships: TopRecommendedScholarship[];
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
    }
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
    async getHistory() {
      return apiBase.request("/api/chat/history");
    }
  },

  admin: {
    async login(data: any) {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Admin login failed");
      const result = await response.json();
      localStorage.setItem("token", result.access_token);
      return result;
    },
    async getDashboard() {
      return api.request("/admin/dashboard");
    },
    async getUsers() {
      return api.request("/admin/users");
    },
    async getScholarships() {
      return api.request("/admin/scholarships");
    },
    async toggleSuspicious(id: number) {
      return api.request(`/admin/scholarships/${id}/flag`, { method: "POST" });
    },
    async getHealth() {
      return api.request("/admin/api-health");
    },
    async getDatabase() {
      return api.request("/admin/database");
    },
    async getAnalytics() {
      return api.request("/admin/analytics");
    },
    async getFraud() {
      return api.request("/admin/fraud");
    },
    // Verification APIs
    async getVerificationStats() {
      return api.request("/admin/verification/stats");
    },
    async getPendingVerifications() {
      return api.request("/admin/verification/pending");
    },
    async getScholarshipVerification(id: number) {
      return api.request(`/admin/scholarships/${id}/verification`);
    },
    async updateScholarshipVerification(id: number, data: any) {
      return api.request(`/admin/scholarships/${id}/verify`, {
        method: "PUT",
        body: JSON.stringify(data)
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

  resume: {
    async download() {
      const token = localStorage.getItem("token");
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/resume/download`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to download resume");
      }

      return response.blob();
    }
  }
};
