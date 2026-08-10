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
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          body: string
          channel: string
          created_at: string
          id: string
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body?: string
          channel?: string
          created_at?: string
          id?: string
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          channel?: string
          created_at?: string
          id?: string
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          features: Json
          id: boolean
          maintenance_mode: boolean
          primary_color: string
          site_name: string
          support_email: string
          tagline: string
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: boolean
          maintenance_mode?: boolean
          primary_color?: string
          site_name?: string
          support_email?: string
          tagline?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: boolean
          maintenance_mode?: boolean
          primary_color?: string
          site_name?: string
          support_email?: string
          tagline?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_customization: {
        Row: {
          color: string
          created_at: string
          hat: string
          skin: string
          trail: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          hat?: string
          skin?: string
          trail?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          hat?: string
          skin?: string
          trail?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          screenshot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          screenshot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          screenshot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_screenshot_id_fkey"
            columns: ["screenshot_id"]
            isOneToOne: false
            referencedRelation: "community_screenshots"
            referencedColumns: ["id"]
          },
        ]
      }
      community_screenshots: {
        Row: {
          biome: string
          created_at: string
          id: string
          image_url: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          biome?: string
          created_at?: string
          id?: string
          image_url: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          biome?: string
          created_at?: string
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          created_at: string
          description: string
          id: string
          kind: string
          media_count: number
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          kind?: string
          media_count?: number
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          kind?: string
          media_count?: number
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_rewards_log: {
        Row: {
          amount: number
          created_at: string
          day: string
          id: string
          reward_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          day: string
          id?: string
          reward_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          day?: string
          id?: string
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          payment_method: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          payment_method?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          payment_method?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          detail: string
          id: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          item_code: string
          metadata: Json
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_code: string
          metadata?: Json
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_code?: string
          metadata?: Json
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mods: {
        Row: {
          author: string
          config: Json
          created_at: string
          description: string | null
          downloads: number
          enabled: boolean
          featured: boolean
          id: string
          mod_type: string
          model_path: string | null
          name: string
          status: string
          updated_at: string
          user_id: string | null
          version: string
        }
        Insert: {
          author?: string
          config?: Json
          created_at?: string
          description?: string | null
          downloads?: number
          enabled?: boolean
          featured?: boolean
          id?: string
          mod_type?: string
          model_path?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id?: string | null
          version?: string
        }
        Update: {
          author?: string
          config?: Json
          created_at?: string
          description?: string | null
          downloads?: number
          enabled?: boolean
          featured?: boolean
          id?: string
          mod_type?: string
          model_path?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actor: string
          created_at: string
          detail: string
          id: string
          ip: string | null
          kind: string
        }
        Insert: {
          actor?: string
          created_at?: string
          detail?: string
          id?: string
          ip?: string | null
          kind?: string
        }
        Update: {
          actor?: string
          created_at?: string
          detail?: string
          id?: string
          ip?: string | null
          kind?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          last_daily_reward_at: string | null
          level: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          last_daily_reward_at?: string | null
          level?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          last_daily_reward_at?: string | null
          level?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
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
      user_settings: {
        Row: {
          created_at: string
          fps_limit: number
          graphics: string
          high_contrast: boolean
          language: string
          larger_text: boolean
          music_volume: number
          reduced_motion: boolean
          sfx_volume: number
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fps_limit?: number
          graphics?: string
          high_contrast?: boolean
          language?: string
          larger_text?: boolean
          music_volume?: number
          reduced_motion?: boolean
          sfx_volume?: number
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fps_limit?: number
          graphics?: string
          high_contrast?: boolean
          language?: string
          larger_text?: boolean
          music_volume?: number
          reduced_motion?: boolean
          sfx_volume?: number
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          collectibles_found: number
          created_at: string
          distance_explored: number
          id: string
          terrains_generated: number
          time_spent_seconds: number
          updated_at: string
        }
        Insert: {
          collectibles_found?: number
          created_at?: string
          distance_explored?: number
          id: string
          terrains_generated?: number
          time_spent_seconds?: number
          updated_at?: string
        }
        Update: {
          collectibles_found?: number
          created_at?: string
          distance_explored?: number
          id?: string
          terrains_generated?: number
          time_spent_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          avatar_url: string
          country: string
          display_name: string
          email: string
          id: string
          last_login_at: string
          registered_at: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          xp: number
        }[]
      }
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          collectibles_found: number
          display_name: string
          distance_explored: number
          level: number
          terrains_generated: number
          user_id: string
          xp: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
    },
  },
} as const
