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
      entitlement_ledger: {
        Row: {
          created_at: string
          event_type: string
          id: number
          monthly_delta: number
          note: string | null
          order_id: string | null
          purchased_delta: number
          shop_id: string
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: never
          monthly_delta?: number
          note?: string | null
          order_id?: string | null
          purchased_delta?: number
          shop_id: string
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: never
          monthly_delta?: number
          note?: string | null
          order_id?: string | null
          purchased_delta?: number
          shop_id?: string
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_ledger_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      ninjavan_rates: {
        Row: {
          created_at: string
          destination_region: string
          destination_township: string
          fee: number
          id: string
          is_active: boolean
          origin_township: string
          source_label: string
        }
        Insert: {
          created_at?: string
          destination_region: string
          destination_township: string
          fee: number
          id?: string
          is_active?: boolean
          origin_township: string
          source_label?: string
        }
        Update: {
          created_at?: string
          destination_region?: string
          destination_township?: string
          fee?: number
          id?: string
          is_active?: boolean
          origin_township?: string
          source_label?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          name: string
          order_id: string
          product_id: string | null
          qty: number
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          order_id: string
          product_id?: string | null
          qty: number
          unit_price: number
        }
        Update: {
          id?: string
          name?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_pack_purchases: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string
          payment_ref_tail: string | null
          qty: number
          review_note: string | null
          reviewed_at: string | null
          screenshot_path: string
          shop_id: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          payment_ref_tail?: string | null
          qty: number
          review_note?: string | null
          reviewed_at?: string | null
          screenshot_path: string
          shop_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_ref_tail?: string | null
          qty?: number
          review_note?: string | null
          reviewed_at?: string | null
          screenshot_path?: string
          shop_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_pack_purchases_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_service: string | null
          grand_total: number
          id: string
          idempotency_key: string | null
          is_billable: boolean | null
          is_duplicate: boolean
          is_test: boolean
          item_total: number
          order_no: string
          origin_township: string | null
          payment_method: string
          payment_ref_tail: string | null
          region: string | null
          shop_id: string
          status: string
          township: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_service?: string | null
          grand_total?: number
          id?: string
          idempotency_key?: string | null
          is_billable?: boolean | null
          is_duplicate?: boolean
          is_test?: boolean
          item_total?: number
          order_no: string
          origin_township?: string | null
          payment_method: string
          payment_ref_tail?: string | null
          region?: string | null
          shop_id: string
          status?: string
          township?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_service?: string | null
          grand_total?: number
          id?: string
          idempotency_key?: string | null
          is_billable?: boolean | null
          is_duplicate?: boolean
          is_test?: boolean
          item_total?: number
          order_no?: string
          origin_township?: string | null
          payment_method?: string
          payment_ref_tail?: string | null
          region?: string | null
          shop_id?: string
          status?: string
          township?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_name: string
          created_at: string
          id: string
          is_active: boolean
          phone: string
          provider: string
          shop_id: string
        }
        Insert: {
          account_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          phone: string
          provider: string
          shop_id: string
        }
        Update: {
          account_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          phone?: string
          provider?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number | null
          confidence: number | null
          created_at: string
          detected_plan: string | null
          id: string
          owner_id: string
          paid_at: string | null
          raw_extraction: Json | null
          receiver_name: string | null
          rejection_reason: string | null
          screenshot_url: string
          sender_name: string | null
          shop_id: string
          status: string
          transaction_id: string | null
          verified_at: string | null
        }
        Insert: {
          amount?: number | null
          confidence?: number | null
          created_at?: string
          detected_plan?: string | null
          id?: string
          owner_id: string
          paid_at?: string | null
          raw_extraction?: Json | null
          receiver_name?: string | null
          rejection_reason?: string | null
          screenshot_url: string
          sender_name?: string | null
          shop_id: string
          status?: string
          transaction_id?: string | null
          verified_at?: string | null
        }
        Update: {
          amount?: number | null
          confidence?: number | null
          created_at?: string
          detected_plan?: string | null
          id?: string
          owner_id?: string
          paid_at?: string | null
          raw_extraction?: Json | null
          receiver_name?: string | null
          rejection_reason?: string | null
          screenshot_url?: string
          sender_name?: string | null
          shop_id?: string
          status?: string
          transaction_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          arrival_date: string | null
          category: string | null
          color: string | null
          created_at: string
          description: string
          id: string
          images: string[]
          is_promotion: boolean
          item_code: string | null
          name: string
          price: number
          promo_price: number | null
          shop_id: string
          size: string | null
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_promotion?: boolean
          item_code?: string | null
          name: string
          price: number
          promo_price?: number | null
          shop_id: string
          size?: string | null
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_promotion?: boolean
          item_code?: string | null
          name?: string
          price?: number
          promo_price?: number | null
          shop_id?: string
          size?: string | null
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          created_at: string
          fee: number
          id: string
          region: string
          shop_id: string
          township: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          region: string
          shop_id: string
          township: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          region?: string
          shop_id?: string
          township?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_applications: {
        Row: {
          amount: number
          created_at: string
          owner_id: string
          payment_method: string
          payment_ref_tail: string | null
          plan: string
          review_note: string | null
          reviewed_at: string | null
          screenshot_path: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          owner_id: string
          payment_method: string
          payment_ref_tail?: string | null
          plan: string
          review_note?: string | null
          reviewed_at?: string | null
          screenshot_path?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          owner_id?: string
          payment_method?: string
          payment_ref_tail?: string | null
          plan?: string
          review_note?: string | null
          reviewed_at?: string | null
          screenshot_path?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_entitlements: {
        Row: {
          active: boolean
          cycle_end: string | null
          cycle_start: string | null
          monthly_quota: number
          monthly_used: number
          pending_plan: string | null
          plan: string
          purchased_balance: number
          shop_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cycle_end?: string | null
          cycle_start?: string | null
          monthly_quota?: number
          monthly_used?: number
          pending_plan?: string | null
          plan: string
          purchased_balance?: number
          shop_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cycle_end?: string | null
          cycle_start?: string | null
          monthly_quota?: number
          monthly_used?: number
          pending_plan?: string | null
          plan?: string
          purchased_balance?: number
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_entitlements_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          created_at: string
          default_delivery_fee: number
          delivery_service: string
          id: string
          is_active: boolean
          platform_suspended: boolean
          seller_is_active: boolean
          logo_url: string | null
          name: string
          origin_region: string | null
          origin_township: string | null
          owner_id: string
          phone: string | null
          plan: string
          slug: string
          theme: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_delivery_fee?: number
          delivery_service?: string
          id?: string
          is_active?: boolean
          platform_suspended?: boolean
          seller_is_active?: boolean
          logo_url?: string | null
          name: string
          origin_region?: string | null
          origin_township?: string | null
          owner_id: string
          phone?: string | null
          plan?: string
          slug: string
          theme?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_delivery_fee?: number
          delivery_service?: string
          id?: string
          is_active?: boolean
          platform_suspended?: boolean
          seller_is_active?: boolean
          logo_url?: string | null
          name?: string
          origin_region?: string | null
          origin_township?: string | null
          owner_id?: string
          phone?: string | null
          plan?: string
          slug?: string
          theme?: Json
          updated_at?: string
        }
        Relationships: []
      }
      store_designs: {
        Row: {
          draft_document: Json
          draft_revision: number
          previous_published_document: Json | null
          published_at: string | null
          published_document: Json
          published_revision: number
          shop_id: string
          updated_at: string
        }
        Insert: {
          draft_document: Json
          draft_revision?: number
          previous_published_document?: Json | null
          published_at?: string | null
          published_document: Json
          published_revision?: number
          shop_id: string
          updated_at?: string
        }
        Update: {
          draft_document?: Json
          draft_revision?: number
          previous_published_document?: Json | null
          published_at?: string | null
          published_document?: Json
          published_revision?: number
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_designs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      shop_monthly_usage: {
        Row: {
          billable_orders: number | null
          month: string | null
          shop_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_plan_from_verified_payment: {
        Args: {
          p_amount: number
          p_confidence: number
          p_paid_at: string
          p_payment_id: string
          p_raw_extraction?: Json
          p_receiver_name: string
          p_sender_name: string
          p_transaction_id: string
        }
        Returns: Json
      }
      admin_activate_subscription: {
        Args: { p_payment_ref?: string; p_plan: string; p_shop_id: string }
        Returns: undefined
      }
      admin_adjust_entitlement: {
        Args: {
          p_monthly_delta: number
          p_note?: string
          p_purchased_delta: number
          p_shop_id: string
        }
        Returns: undefined
      }
      admin_cancel_subscription: {
        Args: { p_shop_id: string }
        Returns: undefined
      }
      admin_credit_order_pack: {
        Args: { p_purchase_id: string; p_transaction_id: string }
        Returns: undefined
      }
      admin_renew_subscription: {
        Args: { p_payment_ref?: string; p_shop_id: string }
        Returns: undefined
      }
      admin_schedule_downgrade: {
        Args: { p_shop_id: string; p_target_plan: string }
        Returns: undefined
      }
      admin_upgrade_plan: {
        Args: { p_payment_ref?: string; p_shop_id: string }
        Returns: undefined
      }
      current_shop_entitlement: { Args: never; Returns: Json }
      current_shop_usage: { Args: never; Returns: Json }
      load_best_selling_product_ids: {
        Args: { p_limit?: number; p_shop_slug: string }
        Returns: {
          product_id: string
          quantity: number
        }[]
      }
      load_own_store_design: { Args: never; Returns: Json }
      load_published_store_design: {
        Args: { p_shop_slug: string }
        Returns: Json
      }
      lookup_order: {
        Args: { p_order_no: string; p_phone: string; p_shop_slug: string }
        Returns: Json
      }
      place_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_idempotency_key?: string
          p_items: Json
          p_payment_method: string
          p_payment_ref_tail: string
          p_region: string
          p_shop_slug: string
          p_street: string
          p_township: string
        }
        Returns: Json
      }
      publish_store_design_draft: {
        Args: { p_expected_draft_revision: number }
        Returns: Json
      }
      resolve_delivery_fee: {
        Args: { p_region: string; p_shop_id: string; p_township: string }
        Returns: number
      }
      rollback_store_design_published: { Args: { p_expected_published_revision: number }; Returns: Json }
      save_store_design_draft: {
        Args: { p_document: Json; p_expected_revision: number }
        Returns: Json
      }
      usage_tier: { Args: { p_count: number }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
