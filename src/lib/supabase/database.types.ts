// AUTO-GENERATED from the Supabase schema. Do not edit by hand.
// Regenerate after migrations: Supabase MCP generate_typescript_types (project xgjywqhkdwuhbypnooow).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          id: string
          name: string
          parent_id: string | null
          possession_default: Database["public"]["Enums"]["possession_mode"]
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          parent_id?: string | null
          possession_default?: Database["public"]["Enums"]["possession_mode"]
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          parent_id?: string | null
          possession_default?: Database["public"]["Enums"]["possession_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          active: boolean
          id: string
          marketplace_pct: number
          max_price: number | null
          min_price: number
        }
        Insert: {
          active?: boolean
          id?: string
          marketplace_pct: number
          max_price?: number | null
          min_price: number
        }
        Update: {
          active?: boolean
          id?: string
          marketplace_pct?: number
          max_price?: number | null
          min_price?: number
        }
        Relationships: []
      }
      inspections: {
        Row: {
          condition_grade: Database["public"]["Enums"]["condition_grade"] | null
          created_at: string
          data_wipe_certified: boolean | null
          functional_test_passed: boolean | null
          id: string
          inspector_id: string | null
          item_id: string
          notes: string | null
          report: Json
        }
        Insert: {
          condition_grade?: Database["public"]["Enums"]["condition_grade"] | null
          created_at?: string
          data_wipe_certified?: boolean | null
          functional_test_passed?: boolean | null
          id?: string
          inspector_id?: string | null
          item_id: string
          notes?: string | null
          report?: Json
        }
        Update: {
          condition_grade?: Database["public"]["Enums"]["condition_grade"] | null
          created_at?: string
          data_wipe_certified?: boolean | null
          functional_test_passed?: boolean | null
          id?: string
          inspector_id?: string | null
          item_id?: string
          notes?: string | null
          report?: Json
        }
        Relationships: []
      }
      item_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["item_status"] | null
          id: string
          item_id: string
          metadata: Json
          to_status: Database["public"]["Enums"]["item_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["item_status"] | null
          id?: string
          item_id: string
          metadata?: Json
          to_status?: Database["public"]["Enums"]["item_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["item_status"] | null
          id?: string
          item_id?: string
          metadata?: Json
          to_status?: Database["public"]["Enums"]["item_status"] | null
        }
        Relationships: []
      }
      item_photos: {
        Row: {
          created_at: string
          id: string
          item_id: string
          kind: string
          sort: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          kind?: string
          sort?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          kind?: string
          sort?: number
          url?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          ai_confidence: number | null
          ai_estimate_max: number | null
          ai_estimate_min: number | null
          auto_accept_above: number | null
          brand: string | null
          category_id: string | null
          condition_grade: Database["public"]["Enums"]["condition_grade"] | null
          created_at: string
          description: string | null
          id: string
          list_price: number | null
          listed_at: string | null
          longest_side_cm: number | null
          model: string | null
          possession: Database["public"]["Enums"]["possession_mode"]
          retail_price: number | null
          sell_by: string | null
          seller_address: string | null
          seller_id: string
          seller_min_price: number | null
          shelf_code: string | null
          sku: string | null
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at: string
          weight_kg: number | null
          zone_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_estimate_max?: number | null
          ai_estimate_min?: number | null
          auto_accept_above?: number | null
          brand?: string | null
          category_id?: string | null
          condition_grade?: Database["public"]["Enums"]["condition_grade"] | null
          created_at?: string
          description?: string | null
          id?: string
          list_price?: number | null
          listed_at?: string | null
          longest_side_cm?: number | null
          model?: string | null
          possession: Database["public"]["Enums"]["possession_mode"]
          retail_price?: number | null
          sell_by?: string | null
          seller_address?: string | null
          seller_id: string
          seller_min_price?: number | null
          shelf_code?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at?: string
          weight_kg?: number | null
          zone_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_estimate_max?: number | null
          ai_estimate_min?: number | null
          auto_accept_above?: number | null
          brand?: string | null
          category_id?: string | null
          condition_grade?: Database["public"]["Enums"]["condition_grade"] | null
          created_at?: string
          description?: string | null
          id?: string
          list_price?: number | null
          listed_at?: string | null
          longest_side_cm?: number | null
          model?: string | null
          possession?: Database["public"]["Enums"]["possession_mode"]
          retail_price?: number | null
          sell_by?: string | null
          seller_address?: string | null
          seller_id?: string
          seller_min_price?: number | null
          shelf_code?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          updated_at?: string
          weight_kg?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_jobs: {
        Row: {
          address: string | null
          created_at: string
          driver_id: string | null
          id: string
          item_id: string | null
          notes: string | null
          order_id: string | null
          scheduled_from: string | null
          scheduled_to: string | null
          status: Database["public"]["Enums"]["logistics_job_status"]
          type: Database["public"]["Enums"]["logistics_job_type"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          order_id?: string | null
          scheduled_from?: string | null
          scheduled_to?: string | null
          status?: Database["public"]["Enums"]["logistics_job_status"]
          type: Database["public"]["Enums"]["logistics_job_type"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          order_id?: string | null
          scheduled_from?: string | null
          scheduled_to?: string | null
          status?: Database["public"]["Enums"]["logistics_job_status"]
          type?: Database["public"]["Enums"]["logistics_job_type"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload: Json
          status: string
          template: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          template: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          template?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          expires_at: string | null
          id: string
          item_id: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          commission_amount: number
          commission_pct: number
          created_at: string
          delivery_address: string | null
          delivery_zone_id: string | null
          id: string
          item_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_ref: string | null
          sale_price: number
          seller_payout: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          buyer_id: string
          commission_amount: number
          commission_pct: number
          created_at?: string
          delivery_address?: string | null
          delivery_zone_id?: string | null
          id?: string
          item_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_ref?: string | null
          sale_price: number
          seller_payout: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          delivery_address?: string | null
          delivery_zone_id?: string | null
          id?: string
          item_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_ref?: string | null
          sale_price?: number
          seller_payout?: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          seller_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          seller_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          seller_id?: string
          status?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          created_at: string
          id: string
          item_id: string
          price: number
          reason: Database["public"]["Enums"]["price_change_reason"]
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          price: number
          reason: Database["public"]["Enums"]["price_change_reason"]
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          price?: number
          reason?: Database["public"]["Enums"]["price_change_reason"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: { key: string; updated_at: string; value: Json }
        Insert: { key: string; updated_at?: string; value: Json }
        Update: { key?: string; updated_at?: string; value?: Json }
        Relationships: []
      }
      staff_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          memo: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          memo?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          memo?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["wallet_txn_type"]
          wallet_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          active: boolean
          created_at: string
          emirate: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          emirate?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          emirate?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      calc_commission: {
        Args: { sale_price: number }
        Returns: {
          marketplace_amount: number
          marketplace_pct: number
          seller_payout: number
        }[]
      }
      is_staff: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "buyer" | "seller" | "ops_agent" | "driver" | "admin"
      condition_grade: "new" | "like_new" | "excellent" | "good" | "fair"
      item_status:
        | "draft"
        | "estimated"
        | "accepted"
        | "pickup_scheduled"
        | "collected"
        | "received"
        | "inspected"
        | "listed"
        | "reserved"
        | "sold"
        | "collection_scheduled"
        | "in_transit"
        | "delivered"
        | "completed"
        | "returned"
        | "unsold_expired"
        | "withdrawn"
        | "declined"
      logistics_job_status:
        | "unassigned"
        | "assigned"
        | "en_route"
        | "completed"
        | "failed"
      logistics_job_type: "pickup_intake" | "pickup_on_sale" | "delivery"
      offer_status:
        | "pending"
        | "accepted"
        | "auto_accepted"
        | "rejected"
        | "expired"
        | "withdrawn"
      order_status:
        | "pending"
        | "paid"
        | "fulfilling"
        | "delivered"
        | "completed"
        | "refunded"
        | "cancelled"
      payment_method:
        | "card"
        | "apple_pay"
        | "google_pay"
        | "tabby"
        | "tamara"
        | "wallet"
      possession_mode: "warehouse" | "in_place"
      price_change_reason: "initial" | "markdown" | "manual" | "offer_accepted"
      wallet_txn_type:
        | "sale_credit"
        | "payout"
        | "bonus"
        | "promotion_spend"
        | "adjustment"
        | "refund_reversal"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
