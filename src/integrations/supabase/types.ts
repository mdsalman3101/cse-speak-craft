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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          code: string
          description: string
          icon: string
          id: string
          title: string
        }
        Insert: {
          code: string
          description?: string
          icon?: string
          id?: string
          title: string
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_id: string
          completion_date: string | null
          created_at: string
          id: string
          program: string
          status: string
          user_id: string
        }
        Insert: {
          certificate_id?: string
          completion_date?: string | null
          created_at?: string
          id?: string
          program?: string
          status?: string
          user_id: string
        }
        Update: {
          certificate_id?: string
          completion_date?: string | null
          created_at?: string
          id?: string
          program?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          is_question: boolean
          likes: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_question?: boolean
          likes?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_question?: boolean
          likes?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          activity_date: string
          id: string
          minutes: number
          tasks: Json
          user_id: string
          words_learned: number
          xp: number
        }
        Insert: {
          activity_date?: string
          id?: string
          minutes?: number
          tasks?: Json
          user_id: string
          words_learned?: number
          xp?: number
        }
        Update: {
          activity_date?: string
          id?: string
          minutes?: number
          tasks?: Json
          user_id?: string
          words_learned?: number
          xp?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          answer: string
          explanation: string | null
          id: string
          lesson_id: string | null
          options: Json
          question: string
          sort_order: number
          type: string
        }
        Insert: {
          answer: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          options?: Json
          question: string
          sort_order?: number
          type?: string
        }
        Update: {
          answer?: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          options?: Json
          question?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          day_number: number
          description: string
          duration_minutes: number
          id: string
          is_free: boolean
          listening_script: string | null
          module_id: string | null
          objective: string | null
          shadowing_lines: Json
          sort_order: number
          speaking_prompt: string | null
          title: string
          video_url: string | null
          week_number: number
        }
        Insert: {
          created_at?: string
          day_number: number
          description?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean
          listening_script?: string | null
          module_id?: string | null
          objective?: string | null
          shadowing_lines?: Json
          sort_order?: number
          speaking_prompt?: string | null
          title: string
          video_url?: string | null
          week_number?: number
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean
          listening_script?: string | null
          module_id?: string | null
          objective?: string | null
          shadowing_lines?: Json
          sort_order?: number
          speaking_prompt?: string | null
          title?: string
          video_url?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string
          description: string
          id: string
          meeting_link: string | null
          mentor_id: string | null
          mentor_name: string
          session_date: string
          session_time: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          meeting_link?: string | null
          mentor_id?: string | null
          mentor_name?: string
          session_date: string
          session_time?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          meeting_link?: string | null
          mentor_id?: string | null
          mentor_name?: string
          session_date?: string
          session_time?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          number: number
          sort_order: number
          tier: number
          tier_name: string
          title: string
          week_end: number
          week_start: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          number: number
          sort_order?: number
          tier: number
          tier_name?: string
          title: string
          week_end: number
          week_start: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          number?: number
          sort_order?: number
          tier?: number
          tier_name?: string
          title?: string
          week_end?: number
          week_start?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: string | null
          college: string | null
          created_at: string
          current_level: string
          email: string | null
          full_name: string
          id: string
          learning_goals: string
          target_role: string | null
          updated_at: string
          weekly_goal_minutes: number
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          current_level?: string
          email?: string | null
          full_name?: string
          id: string
          learning_goals?: string
          target_role?: string | null
          updated_at?: string
          weekly_goal_minutes?: number
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          current_level?: string
          email?: string | null
          full_name?: string
          id?: string
          learning_goals?: string
          target_role?: string | null
          updated_at?: string
          weekly_goal_minutes?: number
          year_of_study?: number | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean
          completion_percentage: number
          created_at: string
          id: string
          last_accessed: string
          lesson_id: string
          minutes_spent: number
          quiz_score: number | null
          sections_done: Json
          user_id: string
          video_position: number
        }
        Insert: {
          completed?: boolean
          completion_percentage?: number
          created_at?: string
          id?: string
          last_accessed?: string
          lesson_id: string
          minutes_spent?: number
          quiz_score?: number | null
          sections_done?: Json
          user_id: string
          video_position?: number
        }
        Update: {
          completed?: boolean
          completion_percentage?: number
          created_at?: string
          id?: string
          last_accessed?: string
          lesson_id?: string
          minutes_spent?: number
          quiz_score?: number | null
          sections_done?: Json
          user_id?: string
          video_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string
          content: string
          created_at: string
          difficulty: string
          id: string
          is_preview: boolean
          module_number: number | null
          title: string
          type: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_preview?: boolean
          module_number?: number | null
          title: string
          type?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_preview?: boolean
          module_number?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "speaking_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_rooms: {
        Row: {
          capacity: number
          created_at: string
          duration_minutes: number
          focus: string
          host_id: string
          id: string
          level: string
          meeting_link: string | null
          notes: string | null
          scheduled_at: string
          status: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          duration_minutes?: number
          focus?: string
          host_id: string
          id?: string
          level?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
          title: string
          topic?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          duration_minutes?: number
          focus?: string
          host_id?: string
          id?: string
          level?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      speaking_submissions: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_seconds: number
          feedback: Json | null
          id: string
          lesson_id: string | null
          mentor_feedback: string | null
          prompt: string
          score: number | null
          status: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number
          feedback?: Json | null
          id?: string
          lesson_id?: string | null
          mentor_feedback?: string | null
          prompt: string
          score?: number | null
          status?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number
          feedback?: Json | null
          id?: string
          lesson_id?: string | null
          mentor_feedback?: string | null
          prompt?: string
          score?: number | null
          status?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaking_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_attempts: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_correct: boolean
          score: number
          sentence_id: string
          user_id: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          score?: number
          sentence_id: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          score?: number
          sentence_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_attempts_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "translation_sentences"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_sentences: {
        Row: {
          alternates: Json
          category: string
          difficulty: string
          english: string
          hindi: string
          id: string
          lesson_id: string | null
          sort_order: number
        }
        Insert: {
          alternates?: Json
          category?: string
          difficulty?: string
          english: string
          hindi: string
          id?: string
          lesson_id?: string | null
          sort_order?: number
        }
        Update: {
          alternates?: Json
          category?: string
          difficulty?: string
          english?: string
          hindi?: string
          id?: string
          lesson_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "translation_sentences_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_code: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_code: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_code?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_code_fkey"
            columns: ["badge_code"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["code"]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vocabulary: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          examples: Json
          hindi_meaning: string
          id: string
          lesson_id: string | null
          meaning: string
          part_of_speech: string | null
          pronunciation: string | null
          related_words: Json
          word: string
        }
        Insert: {
          category?: string
          created_at?: string
          difficulty?: string
          examples?: Json
          hindi_meaning?: string
          id?: string
          lesson_id?: string | null
          meaning: string
          part_of_speech?: string | null
          pronunciation?: string | null
          related_words?: Json
          word: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          examples?: Json
          hindi_meaning?: string
          id?: string
          lesson_id?: string | null
          meaning?: string
          part_of_speech?: string | null
          pronunciation?: string | null
          related_words?: Json
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_progress: {
        Row: {
          id: string
          status: string
          times_correct: number
          times_wrong: number
          updated_at: string
          user_id: string
          vocabulary_id: string
        }
        Insert: {
          id?: string
          status?: string
          times_correct?: number
          times_wrong?: number
          updated_at?: string
          user_id: string
          vocabulary_id: string
        }
        Update: {
          id?: string
          status?: string
          times_correct?: number
          times_wrong?: number
          updated_at?: string
          user_id?: string
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_progress_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_submissions: {
        Row: {
          answer: string
          created_at: string
          exercise_type: string
          feedback: Json | null
          id: string
          lesson_id: string | null
          mentor_feedback: string | null
          score: number | null
          situation: string
          status: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          exercise_type?: string
          feedback?: Json | null
          id?: string
          lesson_id?: string | null
          mentor_feedback?: string | null
          score?: number | null
          situation: string
          status?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          exercise_type?: string
          feedback?: Json | null
          id?: string
          lesson_id?: string | null
          mentor_feedback?: string | null
          score?: number | null
          situation?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "student" | "mentor" | "admin"
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
      app_role: ["student", "mentor", "admin"],
    },
  },
} as const
