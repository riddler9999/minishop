// Auto-generated from the live schema via `mcp__Supabase__generate_typescript_types`
// against project fsxdnmnycizjkgstokze (Mini Tiktok Shop). Regenerate after any
// migration under supabase/migrations/ — do not hand-edit.
//
// NOTE: the additions for migration 0003 (shops.plan; orders.is_test /
// is_duplicate / is_billable; the shop_monthly_usage view; the current_shop_usage
// and usage_tier functions) are hand-authored here so the frontend compiles
// before 0003 is applied. Once 0003 is applied to fsxdnmnycizjkgstokze,
// regenerate this file 1:1 to replace this delta (MIGRATION-PLAN-0003.md §7).

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
          screenshot_path: string
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
          screenshot_path: string
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
          screenshot_path?: string
          status?: string
          updated_at?: string
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
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          grand_total: number
          id: string
          is_billable: boolean
          is_duplicate: boolean
          is_test: boolean
          item_total: number
          order_no: string
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
          grand_total?: number
          id?: string
          is_duplicate?: boolean
          is_test?: boolean
          item_total?: number
          order_no: string
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
          grand_total?: number
          id?: string
          is_duplicate?: boolean
          is_test?: boolean
          item_total?: number
          order_no?: string
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
      shops: {
        Row: {
          created_at: string
          default_delivery_fee: number
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
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
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
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
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: string
          slug?: string
          theme?: Json
          updated_at?: string
        }
        Relationships: []
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
      current_shop_usage: {
        Args: Record<PropertyKey, never>
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
      usage_tier: {
        Args: { p_count: number }
        Returns: string
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
