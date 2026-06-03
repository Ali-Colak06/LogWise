/**
 * Supabase auto-generated types — DO NOT EDIT BY HAND.
 *
 * Kaynak: Supabase MCP `generate_typescript_types` (proje `czbxujioufhmvoajqwzp`)
 * Tekrar üretmek için (kullanıcı tarafı):
 *   npx supabase gen types typescript \
 *     --project-id czbxujioufhmvoajqwzp \
 *     --schema public \
 *     > types/database.generated.ts
 *
 * NOT: Web tabloları (profiles, user_data, feedback, shared_workouts, ...) bu
 * dosyada yer alır ama mobil katmandan KULLANILMAZ — yalnızca `app_*` tabloları.
 * Semantik alias'lar (AppExercisesRow vb.) ve uygulama-katmanı literal union'lar
 * (CycleType, SetType, RirValue, DayIndex) `types/database.ts` köprüsünde tanımlı.
 */

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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_day_meta: {
        Row: {
          created_at: string
          day_note: string | null
          skipped_exercise_ids: string[]
          total_duration_minutes: number | null
          updated_at: string
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          day_note?: string | null
          skipped_exercise_ids?: string[]
          total_duration_minutes?: number | null
          updated_at?: string
          user_id: string
          workout_date: string
        }
        Update: {
          created_at?: string
          day_note?: string | null
          skipped_exercise_ids?: string[]
          total_duration_minutes?: number | null
          updated_at?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      app_exercises: {
        Row: {
          categories: string[]
          created_at: string
          id: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_profiles: {
        Row: {
          active_program_id: string | null
          avatar: string | null
          created_at: string
          display_name: string | null
          locale: string | null
          preferences: Json
          theme: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          active_program_id?: string | null
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          locale?: string | null
          preferences?: Json
          theme?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          active_program_id?: string | null
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          locale?: string | null
          preferences?: Json
          theme?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_profiles_active_program_fk"
            columns: ["active_program_id"]
            isOneToOne: false
            referencedRelation: "app_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      app_program_days: {
        Row: {
          day_index: number
          exercise_ref: string
          position: number
          program_id: string
        }
        Insert: {
          day_index: number
          exercise_ref: string
          position: number
          program_id: string
        }
        Update: {
          day_index?: number
          exercise_ref?: string
          position?: number
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "app_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      app_programs: {
        Row: {
          activated_at: string | null
          created_at: string
          cycle_type: string
          deload_every: number | null
          description: string | null
          id: string
          name: string
          off_days: number[]
          preset_origin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          cycle_type?: string
          deload_every?: number | null
          description?: string | null
          id?: string
          name: string
          off_days?: number[]
          preset_origin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          cycle_type?: string
          deload_every?: number | null
          description?: string | null
          id?: string
          name?: string
          off_days?: number[]
          preset_origin?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_sets: {
        Row: {
          created_at: string
          id: string
          reps: number | null
          rir: string | null
          set_index: number
          set_type: string
          weight: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reps?: number | null
          rir?: string | null
          set_index: number
          set_type?: string
          weight?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reps?: number | null
          rir?: string | null
          set_index?: number
          set_type?: string
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "app_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_workouts: {
        Row: {
          created_at: string
          duration_minutes: number | null
          exercise_ref: string
          id: string
          notes: string | null
          position: number
          superset_group: number | null
          updated_at: string
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          exercise_ref: string
          id?: string
          notes?: string | null
          position?: number
          superset_group?: number | null
          updated_at?: string
          user_id: string
          workout_date: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          exercise_ref?: string
          id?: string
          notes?: string | null
          position?: number
          superset_group?: number | null
          updated_at?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "shared_workout_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          cat: string
          created_at: string | null
          id: string
          msg: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          cat?: string
          created_at?: string | null
          id: string
          msg: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          cat?: string
          created_at?: string | null
          id?: string
          msg?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          is_public: boolean | null
          show_profile_info: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          is_public?: boolean | null
          show_profile_info?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          is_public?: boolean | null
          show_profile_info?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      shared_workout_comments: {
        Row: {
          content: string
          created_at: string | null
          edited: boolean | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited?: boolean | null
          id: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited?: boolean | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_workout_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "shared_workout_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_workout_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "shared_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workouts: {
        Row: {
          caption: string | null
          created_at: string | null
          exercise_names: Json | null
          id: string
          user_id: string | null
          workout_data: Json
          workout_date: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          exercise_names?: Json | null
          id: string
          user_id?: string | null
          workout_data?: Json
          workout_date: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          exercise_names?: Json | null
          id?: string
          user_id?: string | null
          workout_data?: Json
          workout_date?: string
        }
        Relationships: []
      }
      user_data: {
        Row: {
          data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_prs: {
        Row: {
          estimated_1rm: number | null
          exercise_name: string
          max_reps: number | null
          max_weight: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          estimated_1rm?: number | null
          exercise_name: string
          max_reps?: number | null
          max_weight?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          estimated_1rm?: number | null
          exercise_name?: string
          max_reps?: number | null
          max_weight?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_own_account: { Args: never; Returns: undefined }
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
