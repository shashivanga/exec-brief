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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          dashboard_id: string
          data: Json | null
          hidden: boolean | null
          id: string
          pinned: boolean | null
          position: number
          refreshed_at: string | null
          sources: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_id: string
          data?: Json | null
          hidden?: boolean | null
          id?: string
          pinned?: boolean | null
          position: number
          refreshed_at?: string | null
          sources?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_id?: string
          data?: Json | null
          hidden?: boolean | null
          id?: string
          pinned?: boolean | null
          position?: number
          refreshed_at?: string | null
          sources?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          aliases: string[] | null
          created_at: string
          domain: string | null
          id: string
          name: string
          ticker: string | null
          user_id: string
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          ticker?: string | null
          user_id: string
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          ticker?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dashboards: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      document_texts: {
        Row: {
          created_at: string
          document_id: string
          page_count: number | null
          text: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          page_count?: number | null
          text?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          page_count?: number | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_texts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          id: string
          kind: string
          status: string
          storage_path: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          id?: string
          kind: string
          status?: string
          storage_path: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          id?: string
          kind?: string
          status?: string
          storage_path?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feeds: {
        Row: {
          active: boolean | null
          company_id: string | null
          created_at: string
          id: string
          kind: string
          topic_id: string | null
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          id?: string
          kind: string
          topic_id?: string | null
          url: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          topic_id?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeds_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      function_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          details: Json | null
          errors_count: number | null
          function_name: string
          id: string
          items_processed: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          errors_count?: number | null
          function_name: string
          id?: string
          items_processed?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          errors_count?: number | null
          function_name?: string
          id?: string
          items_processed?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          published_at: string
          raw: Json | null
          source_id: string
          source_kind: string
          summary: string | null
          title: string
          topic_id: string | null
          url: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          published_at: string
          raw?: Json | null
          source_id: string
          source_kind: string
          summary?: string | null
          title: string
          topic_id?: string | null
          url: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          published_at?: string
          raw?: Json | null
          source_id?: string
          source_kind?: string
          summary?: string | null
          title?: string
          topic_id?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_points: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          period: string
          source_document_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          period: string
          source_document_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          period?: string
          source_document_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_points_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_points_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string
          id: string
          name: string
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          unit: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          id: string
          name: string
          queries: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          queries: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          queries?: string[]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      prune_old_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
