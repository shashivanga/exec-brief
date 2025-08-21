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
      ai_jobs: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          input_ref_id: string
          input_ref_type: string
          job: string
          model: string | null
          org_id: string
          output: Json | null
          provider: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_ref_id: string
          input_ref_type: string
          job: string
          model?: string | null
          org_id: string
          output?: Json | null
          provider?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_ref_id?: string
          input_ref_type?: string
          job?: string
          model?: string | null
          org_id?: string
          output?: Json | null
          provider?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          card_ids: string[]
          created_at: string
          for_date: string
          generated_by: string
          id: string
          org_id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          card_ids: string[]
          created_at?: string
          for_date: string
          generated_by: string
          id?: string
          org_id: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          card_ids?: string[]
          created_at?: string
          for_date?: string
          generated_by?: string
          id?: string
          org_id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_templates: {
        Row: {
          description: string | null
          key: string
          schema: Json | null
          title: string
          type: string
        }
        Insert: {
          description?: string | null
          key: string
          schema?: Json | null
          title: string
          type: string
        }
        Update: {
          description?: string | null
          key?: string
          schema?: Json | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          created_at: string
          dashboard_id: string
          data: Json | null
          hidden: boolean | null
          id: string
          org_id: string
          pinned: boolean | null
          position: number
          refreshed_at: string | null
          size: string | null
          sources: Json | null
          template_key: string
          title: string | null
        }
        Insert: {
          created_at?: string
          dashboard_id: string
          data?: Json | null
          hidden?: boolean | null
          id?: string
          org_id: string
          pinned?: boolean | null
          position: number
          refreshed_at?: string | null
          size?: string | null
          sources?: Json | null
          template_key: string
          title?: string | null
        }
        Update: {
          created_at?: string
          dashboard_id?: string
          data?: Json | null
          hidden?: boolean | null
          id?: string
          org_id?: string
          pinned?: boolean | null
          position?: number
          refreshed_at?: string | null
          size?: string | null
          sources?: Json | null
          template_key?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_template_key_fkey"
            columns: ["template_key"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["key"]
          },
        ]
      }
      company_catalog: {
        Row: {
          aliases: string[] | null
          created_at: string
          domain: string | null
          id: string
          name: string
          ticker: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          ticker?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          ticker?: string | null
        }
        Relationships: []
      }
      dashboards: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          name: string | null
          org_id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string | null
          org_id: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string | null
          org_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          bullets: Json | null
          created_at: string
          document_id: string
          entities: Json | null
          kpis: Json | null
          method: string
        }
        Insert: {
          bullets?: Json | null
          created_at?: string
          document_id: string
          entities?: Json | null
          kpis?: Json | null
          method: string
        }
        Update: {
          bullets?: Json | null
          created_at?: string
          document_id?: string
          entities?: Json | null
          kpis?: Json | null
          method?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string
          status: string | null
          storage_path: string
          uploaded_at: string
          uploader_id: string
        }
        Insert: {
          file_name: string
          id?: string
          kind: string
          org_id: string
          status?: string | null
          storage_path: string
          uploaded_at?: string
          uploader_id: string
        }
        Update: {
          file_name?: string
          id?: string
          kind?: string
          org_id?: string
          status?: string | null
          storage_path?: string
          uploaded_at?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          created_at: string
          id: string
          kind: string
          org_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          org_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          org_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_topics: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          org_id: string
          queries: string[]
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          queries: string[]
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          queries?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "industry_topics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ingested_items: {
        Row: {
          competitor_id: string | null
          created_at: string
          id: string
          industry_topic_id: string | null
          org_id: string
          published_at: string
          raw: Json | null
          source_id: string
          source_kind: string
          summary: string | null
          title: string
          url: string
        }
        Insert: {
          competitor_id?: string | null
          created_at?: string
          id?: string
          industry_topic_id?: string | null
          org_id: string
          published_at: string
          raw?: Json | null
          source_id: string
          source_kind: string
          summary?: string | null
          title: string
          url: string
        }
        Update: {
          competitor_id?: string | null
          created_at?: string
          id?: string
          industry_topic_id?: string | null
          org_id?: string
          published_at?: string
          raw?: Json | null
          source_id?: string
          source_kind?: string
          summary?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingested_items_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "org_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingested_items_industry_topic_id_fkey"
            columns: ["industry_topic_id"]
            isOneToOne: false
            referencedRelation: "industry_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingested_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_definitions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          unit: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_definitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_values: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          org_id: string
          period: string
          source_document_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          org_id: string
          period: string
          source_document_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          org_id?: string
          period?: string
          source_document_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_values_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_values_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          daily_digest_enabled: boolean | null
          digest_hour_utc: number | null
          user_id: string
        }
        Insert: {
          daily_digest_enabled?: boolean | null
          digest_hour_utc?: number | null
          user_id: string
        }
        Update: {
          daily_digest_enabled?: boolean | null
          digest_hour_utc?: number | null
          user_id?: string
        }
        Relationships: []
      }
      org_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          label: string
          org_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          label: string
          org_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_companies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          org_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json | null
          created_at: string
          id: string
          name: string
          plan: string | null
        }
        Insert: {
          branding?: Json | null
          created_at?: string
          id?: string
          name: string
          plan?: string | null
        }
        Update: {
          branding?: Json | null
          created_at?: string
          id?: string
          name?: string
          plan?: string | null
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
      source_feeds: {
        Row: {
          active: boolean | null
          competitor_id: string
          created_at: string
          id: string
          kind: string
          url: string
        }
        Insert: {
          active?: boolean | null
          competitor_id: string
          created_at?: string
          id?: string
          kind: string
          url: string
        }
        Update: {
          active?: boolean | null
          competitor_id?: string
          created_at?: string
          id?: string
          kind?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_feeds_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "org_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_orgs: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_org_member: {
        Args: { org_uuid: string }
        Returns: boolean
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
