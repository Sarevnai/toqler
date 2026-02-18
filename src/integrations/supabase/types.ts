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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          follow_up_email: boolean | null
          hide_branding: boolean | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up_email?: boolean | null
          hide_branding?: boolean | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up_email?: boolean | null
          hide_branding?: boolean | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_memberships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          uses_count: number | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
          valid_until?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          card_id: string | null
          company_id: string | null
          created_at: string
          cta_type: string | null
          device: string | null
          event_type: string
          id: string
          metadata: Json | null
          profile_id: string | null
          source: string | null
        }
        Insert: {
          card_id?: string | null
          company_id?: string | null
          created_at?: string
          cta_type?: string | null
          device?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          source?: string | null
        }
        Update: {
          card_id?: string | null
          company_id?: string | null
          created_at?: string
          cta_type?: string | null
          device?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "nfc_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          active: boolean
          company_id: string
          config: Json
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          config?: Json
          created_at?: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          config?: Json
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["membership_role"]
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string
          id: string
          invoice_pdf_url: string | null
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date: string
          id?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string
          id?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          card_id: string | null
          company_id: string
          consent: boolean
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          profile_id: string | null
        }
        Insert: {
          card_id?: string | null
          company_id: string
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          profile_id?: string | null
        }
        Update: {
          card_id?: string | null
          company_id?: string
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "nfc_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_cards: {
        Row: {
          company_id: string
          created_at: string
          id: string
          label: string
          profile_id: string | null
          slug: string | null
          slug_locked: boolean
          status: string
          tag_uid: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          label: string
          profile_id?: string | null
          slug?: string | null
          slug_locked?: boolean
          status?: string
          tag_uid: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          profile_id?: string | null
          slug?: string | null
          slug_locked?: boolean
          status?: string
          tag_uid?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfc_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          metadata: Json | null
          method: string | null
          status: string
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          method?: string | null
          status?: string
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          method?: string | null
          status?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          feature_key: string
          feature_value: string
          id: string
          plan_id: string
        }
        Insert: {
          feature_key: string
          feature_value: string
          id?: string
          plan_id: string
        }
        Update: {
          feature_key?: string
          feature_value?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          sort_order: number | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      profile_layouts: {
        Row: {
          accent_color: string
          background_style: string
          bg_color: string
          bg_image_url: string | null
          button_color: string
          button_style: string
          button_text_color: string
          card_color: string
          company_id: string
          cover_url: string | null
          created_at: string
          cta_order: Json
          font_family: string
          font_style: string
          icon_bg_color: string
          icon_color: string
          id: string
          layout_style: string
          show_bio: boolean
          show_company_header: boolean
          show_contact: boolean
          show_lead_form: boolean
          show_save_contact: boolean
          show_social: boolean
          show_stats_row: boolean
          show_video: boolean
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_style?: string
          bg_color?: string
          bg_image_url?: string | null
          button_color?: string
          button_style?: string
          button_text_color?: string
          card_color?: string
          company_id: string
          cover_url?: string | null
          created_at?: string
          cta_order?: Json
          font_family?: string
          font_style?: string
          icon_bg_color?: string
          icon_color?: string
          id?: string
          layout_style?: string
          show_bio?: boolean
          show_company_header?: boolean
          show_contact?: boolean
          show_lead_form?: boolean
          show_save_contact?: boolean
          show_social?: boolean
          show_stats_row?: boolean
          show_video?: boolean
          text_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_style?: string
          bg_color?: string
          bg_image_url?: string | null
          button_color?: string
          button_style?: string
          button_text_color?: string
          card_color?: string
          company_id?: string
          cover_url?: string | null
          created_at?: string
          cta_order?: Json
          font_family?: string
          font_style?: string
          icon_bg_color?: string
          icon_color?: string
          id?: string
          layout_style?: string
          show_bio?: boolean
          show_company_header?: boolean
          show_contact?: boolean
          show_lead_form?: boolean
          show_save_contact?: boolean
          show_social?: boolean
          show_stats_row?: boolean
          show_video?: boolean
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_layouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          company_id: string
          cover_url: string | null
          created_at: string
          email: string | null
          github: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          photo_offset_x: number
          photo_offset_y: number
          photo_url: string | null
          pinterest: string | null
          published: boolean
          role_title: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          user_id: string | null
          video_url: string | null
          website: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          bio?: string | null
          company_id: string
          cover_url?: string | null
          created_at?: string
          email?: string | null
          github?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          photo_offset_x?: number
          photo_offset_y?: number
          photo_url?: string | null
          pinterest?: string | null
          published?: boolean
          role_title?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          bio?: string | null
          company_id?: string
          cover_url?: string | null
          created_at?: string
          email?: string | null
          github?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          photo_offset_x?: number
          photo_offset_y?: number
          photo_url?: string | null
          pinterest?: string | null
          published?: boolean
          role_title?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_plan_id: string | null
          old_plan_id: string | null
          subscription_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_plan_id?: string | null
          old_plan_id?: string | null
          subscription_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_plan_id?: string | null
          old_plan_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_reason: string | null
          canceled_at: string | null
          company_id: string
          coupon_id: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          cancel_reason?: string | null
          canceled_at?: string | null
          company_id: string
          coupon_id?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          cancel_reason?: string | null
          canceled_at?: string | null
          company_id?: string
          coupon_id?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { _invitation_id: string }
        Returns: undefined
      }
      create_company_with_membership: {
        Args: { _name: string }
        Returns: string
      }
      get_admin_billing_kpis: { Args: never; Returns: Json }
      get_admin_companies: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: Json
      }
      get_admin_company_detail: { Args: { _company_id: string }; Returns: Json }
      get_admin_growth_chart: { Args: never; Returns: Json }
      get_admin_kpis: { Args: never; Returns: Json }
      get_admin_subscriptions: {
        Args: {
          _limit?: number
          _offset?: number
          _plan_slug?: string
          _search?: string
          _status?: string
        }
        Returns: Json
      }
      get_cta_distribution: { Args: { _company_id: string }; Returns: Json }
      get_daily_chart: { Args: { _company_id: string }; Returns: Json }
      get_dashboard_kpis: { Args: { _company_id: string }; Returns: Json }
      get_monthly_chart: { Args: { _company_id: string }; Returns: Json }
      get_pending_invitations: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
        }[]
      }
      is_company_admin: { Args: { _company_id: string }; Returns: boolean }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_platform_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      membership_role: "admin" | "member"
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
      membership_role: ["admin", "member"],
    },
  },
} as const
