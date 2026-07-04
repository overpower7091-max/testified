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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      boards: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          board_id: string
          id: string
          level: Database["public"]["Enums"]["class_level"]
          name: string
        }
        Insert: {
          board_id: string
          id?: string
          level: Database["public"]["Enums"]["class_level"]
          name: string
        }
        Update: {
          board_id?: string
          id?: string
          level?: Database["public"]["Enums"]["class_level"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          class: Database["public"]["Enums"]["class_level"] | null
          created_at: string
          full_name: string | null
          id: string
          is_banned: boolean
          onboarding_completed: boolean
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          class?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string
          full_name?: string | null
          id: string
          is_banned?: boolean
          onboarding_completed?: boolean
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          class?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          onboarding_completed?: boolean
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      question_banks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          topic_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_banks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: Json
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          explanation: string | null
          id: string
          images: string[]
          options: Json
          question: string
          question_bank_id: string
          tags: string[]
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          correct_answer: Json
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          explanation?: string | null
          id?: string
          images?: string[]
          options?: Json
          question: string
          question_bank_id: string
          tags?: string[]
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          explanation?: string | null
          id?: string
          images?: string[]
          options?: Json
          question?: string
          question_bank_id?: string
          tags?: string[]
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_index: number | null
          session_id: string | null
          subject_id: string | null
          time_seconds: number
          topic_id: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_index?: number | null
          session_id?: string | null
          subject_id?: string | null
          time_seconds?: number
          topic_id?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_index?: number | null
          session_id?: string | null
          subject_id?: string | null
          time_seconds?: number
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string
          color: string | null
          icon: string | null
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          class_id: string
          color?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          class_id?: string
          color?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin"
      class_level: "6" | "7" | "8" | "9" | "10" | "11" | "12"
      difficulty: "easy" | "medium" | "hard"
      question_type:
        | "single"
        | "multiple"
        | "true_false"
        | "assertion_reason"
        | "numerical"
        | "fill_blank"
        | "match"
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
    Enums: {
      app_role: ["student", "admin"],
      class_level: ["6", "7", "8", "9", "10", "11", "12"],
      difficulty: ["easy", "medium", "hard"],
      question_type: [
        "single",
        "multiple",
        "true_false",
        "assertion_reason",
        "numerical",
        "fill_blank",
        "match",
      ],
    },
  },
} as const
