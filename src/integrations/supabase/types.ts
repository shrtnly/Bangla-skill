export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      certificates: {
        Row: {
          certificate_data: Json
          certificate_number: string
          certificate_type: string
          course_id: string
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string
          module_id: string | null
          updated_at: string
          user_id: string
          verification_code: string
        }
        Insert: {
          certificate_data?: Json
          certificate_number: string
          certificate_type?: string
          course_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string
          module_id?: string | null
          updated_at?: string
          user_id: string
          verification_code: string
        }
        Update: {
          certificate_data?: Json
          certificate_number?: string
          certificate_type?: string
          course_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string
          module_id?: string | null
          updated_at?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_progress: {
        Row: {
          chapter_id: string
          completed: boolean | null
          completed_at: string | null
          completed_learning_points: string[] | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed?: boolean | null
          completed_at?: string | null
          completed_learning_points?: string[] | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed?: boolean | null
          completed_at?: string | null
          completed_learning_points?: string[] | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string | null
          id: string
          module_id: string
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id: string
          order_index: number
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          badge: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          rating: number | null
          title: string
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          rating?: number | null
          title: string
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          rating?: number | null
          title?: string
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          current_module_id: string | null
          enrolled_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          current_module_id?: string | null
          enrolled_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          current_module_id?: string | null
          enrolled_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_points: {
        Row: {
          chapter_id: string
          content: string
          created_at: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          chapter_id: string
          content: string
          created_at?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          chapter_id?: string
          content?: string
          created_at?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_points_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed_at: string | null
          id: string
          learning_completed: boolean | null
          module_id: string
          practice_completed: boolean | null
          quiz_passed: boolean | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          learning_completed?: boolean | null
          module_id: string
          practice_completed?: boolean | null
          quiz_passed?: boolean | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          learning_completed?: boolean | null
          module_id?: string
          practice_completed?: boolean | null
          quiz_passed?: boolean | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          max_free_attempts: number | null
          order_index: number
          passing_score: number | null
          points: number | null
          retake_wait_hours: number | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          max_free_attempts?: number | null
          order_index: number
          passing_score?: number | null
          points?: number | null
          retake_wait_hours?: number | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          max_free_attempts?: number | null
          order_index?: number
          passing_score?: number | null
          points?: number | null
          retake_wait_hours?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_attempts: {
        Row: {
          attempt_number: number
          completed_at: string | null
          id: string
          module_id: string
          questions_data: Json
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_number: number
          completed_at?: string | null
          id?: string
          module_id: string
          questions_data: Json
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          id?: string
          module_id?: string
          questions_data?: Json
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          module_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          current_streak: number | null
          date_of_birth: string | null
          education_level: string | null
          employment_status: string | null
          experience_years: number | null
          field_of_study: string | null
          full_name: string | null
          gender: string | null
          graduation_year: number | null
          id: string
          institution: string | null
          job_title: string | null
          location: string | null
          phone: string | null
          points: number | null
          total_certificates: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          current_streak?: number | null
          date_of_birth?: string | null
          education_level?: string | null
          employment_status?: string | null
          experience_years?: number | null
          field_of_study?: string | null
          full_name?: string | null
          gender?: string | null
          graduation_year?: number | null
          id: string
          institution?: string | null
          job_title?: string | null
          location?: string | null
          phone?: string | null
          points?: number | null
          total_certificates?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          current_streak?: number | null
          date_of_birth?: string | null
          education_level?: string | null
          employment_status?: string | null
          experience_years?: number | null
          field_of_study?: string | null
          full_name?: string | null
          gender?: string | null
          graduation_year?: number | null
          id?: string
          institution?: string | null
          job_title?: string | null
          location?: string | null
          phone?: string | null
          points?: number | null
          total_certificates?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          can_retake_at: string | null
          completed_at: string | null
          id: string
          module_id: string
          passed: boolean | null
          score: number
          started_at: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_number: number
          can_retake_at?: string | null
          completed_at?: string | null
          id?: string
          module_id: string
          passed?: boolean | null
          score: number
          started_at?: string | null
          total_questions: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          can_retake_at?: string | null
          completed_at?: string | null
          id?: string
          module_id?: string
          passed?: boolean | null
          score?: number
          started_at?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_generate_certificate: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: Json
      }
      generate_certificate_number: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: string
      }
      generate_verification_code: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
