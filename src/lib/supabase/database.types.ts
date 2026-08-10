// AUTO-GENERATED from the Supabase schema (project xgjywqhkdwuhbypnooow), lightly hand-adjusted:
// create_intake's optional args are relaxed to `| null` (the generator marks them required).
// Regenerate after migrations via Supabase MCP generate_typescript_types, then re-apply that tweak.

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
        Relationships: [
          {
            foreignKeyName: "inspections_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "item_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          user_id: string
          item_id: string
          created_at: string
        }
        Insert: {
          user_id?: string
          item_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          item_id?: string
          created_at?: string
        }
        Relationships: []
      }
      item_metrics: {
        Row: {
          item_id: string
          views: number
          saves: number
          updated_at: string
        }
        Insert: {
          item_id: string
          views?: number
          saves?: number
          updated_at?: string
        }
        Update: {
          item_id?: string
          views?: number
          saves?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_metrics_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_stages: {
        Row: {
          id: string
          name: string
          sequence: number
          maps_to_status: string | null
          is_closed: boolean
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sequence?: number
          maps_to_status?: string | null
          is_closed?: boolean
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sequence?: number
          maps_to_status?: string | null
          is_closed?: boolean
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      carriers: {
        Row: {
          id: string
          name: string
          kind: string
          contact_phone: string | null
          tracking_url: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          kind?: string
          contact_phone?: string | null
          tracking_url?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          kind?: string
          contact_phone?: string | null
          tracking_url?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          id: string
          order_id: string
          buyer_id: string
          reason: string
          description: string | null
          photo_urls: string[] | null
          status: string
          refund_amount: number | null
          resolution_note: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          buyer_id: string
          reason: string
          description?: string | null
          photo_urls?: string[] | null
          status?: string
          refund_amount?: number | null
          resolution_note?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          buyer_id?: string
          reason?: string
          description?: string | null
          photo_urls?: string[] | null
          status?: string
          refund_amount?: number | null
          resolution_note?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "item_photos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
          seller_target_price: number | null
          floor_reached_at: string | null
          end_of_life_pref: string
          company_owned: boolean
          price_approval: string
          proposed_price: number | null
          price_proposed_at: string | null
          shelf_code: string | null
          sku: string | null
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at: string
          visit_id: string | null
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
          seller_target_price?: number | null
          floor_reached_at?: string | null
          end_of_life_pref?: string
          company_owned?: boolean
          price_approval?: string
          proposed_price?: number | null
          price_proposed_at?: string | null
          shelf_code?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at?: string
          visit_id?: string | null
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
          seller_target_price?: number | null
          floor_reached_at?: string | null
          end_of_life_pref?: string
          company_owned?: boolean
          price_approval?: string
          proposed_price?: number | null
          price_proposed_at?: string | null
          shelf_code?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          updated_at?: string
          visit_id?: string | null
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
          visit_id: string | null
          carrier_id: string | null
          tracking_ref: string | null
          contact_name: string | null
          contact_phone: string | null
          alt_phone: string | null
          building: string | null
          unit: string | null
          area: string | null
          makani: string | null
          maps_url: string | null
          access_notes: string | null
          scheduled_date: string | null
          slot: string | null
          sequence: number | null
          arrived_at: string | null
          completed_at: string | null
          proof_photo_url: string | null
          completion_notes: string | null
          failure_reason: string | null
          attempt_count: number
          needs_two_people: boolean
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
        Relationships: [
          {
            foreignKeyName: "logistics_jobs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_jobs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
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
          title: string | null
          body: string | null
          link: string | null
          read_at: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          template: string
          user_id: string
          title: string | null
          body: string | null
          link: string | null
          read_at: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          template?: string
          user_id?: string
          title?: string | null
          body?: string | null
          link?: string | null
          read_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "offers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
          fulfilment: string
          delivered_at: string | null
          payout_status: string
          payout_release_at: string | null
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
          fulfilment?: string
          delivered_at?: string | null
          payout_status?: string
          payout_release_at?: string | null
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
          iban: string | null
          holder: string | null
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
          iban?: string | null
          holder?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_visits: {
        Row: {
          id: string
          seller_id: string
          zone_id: string | null
          address: string
          scheduled_date: string
          slot: string
          notes: string | null
          status: string
          agent_id: string | null
          fee_amount: number
          fee_status: string
          created_at: string
          updated_at: string
          stage_id: string | null
          fee_collected: boolean
          report_summary: string | null
          declined_notes: string | null
          report_submitted_at: string | null
          items_collected: number
          contact_phone: string | null
          building: string | null
          unit: string | null
          area: string | null
          makani: string | null
          maps_url: string | null
          access_notes: string | null
        }
        Insert: {
          id?: string
          seller_id: string
          zone_id?: string | null
          address: string
          scheduled_date: string
          slot: string
          notes?: string | null
          status?: string
          agent_id?: string | null
          fee_amount?: number
          fee_status?: string
          created_at?: string
          updated_at?: string
          stage_id?: string | null
          fee_collected?: boolean
          report_summary?: string | null
          declined_notes?: string | null
          report_submitted_at?: string | null
          items_collected?: number
          contact_phone?: string | null
          building?: string | null
          unit?: string | null
          area?: string | null
          makani?: string | null
          maps_url?: string | null
          access_notes?: string | null
        }
        Update: {
          id?: string
          seller_id?: string
          zone_id?: string | null
          address?: string
          scheduled_date?: string
          slot?: string
          notes?: string | null
          status?: string
          agent_id?: string | null
          fee_amount?: number
          fee_status?: string
          created_at?: string
          updated_at?: string
          stage_id?: string | null
          fee_collected?: boolean
          report_summary?: string | null
          declined_notes?: string | null
          report_submitted_at?: string | null
          items_collected?: number
          contact_phone?: string | null
          building?: string | null
          unit?: string | null
          area?: string | null
          makani?: string | null
          maps_url?: string | null
          access_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_visits_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_visits_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "price_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          default_building: string | null
          default_unit: string | null
          default_area: string | null
          default_makani: string | null
          default_maps_url: string | null
          default_access_notes: string | null
          bank_iban: string | null
          bank_holder: string | null
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
          default_building?: string | null
          default_unit?: string | null
          default_area?: string | null
          default_makani?: string | null
          default_maps_url?: string | null
          default_access_notes?: string | null
          bank_iban?: string | null
          bank_holder?: string | null
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
        Relationships: [
          {
            foreignKeyName: "staff_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
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
      create_intake: {
        Args: {
          p_address: string | null
          p_brand: string | null
          p_category_id: string | null
          p_condition: Database["public"]["Enums"]["condition_grade"]
          p_confidence: number
          p_estimate_max: number
          p_estimate_min: number
          p_longest_side_cm: number | null
          p_model: string | null
          p_photo_urls: string[] | null
          p_pickup_from: string | null
          p_pickup_to: string | null
          p_possession: Database["public"]["Enums"]["possession_mode"]
          p_retail_price: number | null
          p_seller_min_price: number | null
          p_seller_target_price?: number | null
          p_title: string
          p_weight_kg: number | null
          p_zone_id: string | null
        }
        Returns: string
      }
      is_staff: { Args: { uid: string }; Returns: boolean }
      ops_set_status: {
        Args: { p_item_id: string; p_to: Database["public"]["Enums"]["item_status"] }
        Returns: undefined
      }
      ops_record_inspection: {
        Args: {
          p_item_id: string
          p_condition: Database["public"]["Enums"]["condition_grade"]
          p_functional: boolean
          p_data_wipe: boolean
          p_notes: string | null
        }
        Returns: undefined
      }
      ops_list_item: {
        Args: { p_item_id: string; p_list_price: number }
        Returns: undefined
      }
      purchase_item: {
        Args: { p_item_id: string }
        Returns: string
      }
      record_item_view: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      book_pickup_visit: {
        Args: {
          p_zone_id: string | null
          p_address: string
          p_date: string
          p_slot: string
          p_notes?: string | null
          p_phone?: string | null
          p_building?: string | null
          p_unit?: string | null
          p_area?: string | null
          p_makani?: string | null
          p_maps_url?: string | null
          p_access_notes?: string | null
        }
        Returns: string
      }
      ops_set_visit_status: {
        Args: { p_visit_id: string; p_status: string }
        Returns: undefined
      }
      ops_add_item_from_visit: {
        Args: {
          p_visit_id: string
          p_title: string
          p_category_id: string | null
          p_brand: string | null
          p_condition: Database["public"]["Enums"]["condition_grade"]
          p_estimate_min: number
          p_estimate_max: number
          p_seller_min_price?: number | null
          p_retail_price?: number | null
          p_photo_urls?: string[] | null
          p_notes?: string | null
        }
        Returns: string
      }
      ops_set_visit_stage: {
        Args: { p_visit_id: string; p_stage_id: string }
        Returns: undefined
      }
      ops_save_visit_stage: {
        Args: {
          p_id: string | null
          p_name: string
          p_sequence: number
          p_maps_to_status?: string | null
          p_is_closed?: boolean
        }
        Returns: string
      }
      ops_delete_visit_stage: {
        Args: { p_id: string }
        Returns: undefined
      }
      seller_decide_price: { Args: { p_item_id: string; p_approve: boolean }; Returns: undefined }
      mark_notifications_read: { Args: { p_ids?: string[] | null }; Returns: undefined }
      visit_slot_availability: {
        Args: { p_zone_id: string | null; p_from: string; p_to: string }
        Returns: { d: string; slot: string; booked: number; capacity: number }[]
      }
      submit_visit_report: {
        Args: { p_visit_id: string; p_summary?: string | null; p_declined?: string | null; p_fee_collected?: boolean }
        Returns: undefined
      }
      apply_markdowns: {
        Args: Record<string, never>
        Returns: {
          item_id: string
          sku: string | null
          old_price: number
          new_price: number
          hit_floor: boolean
        }[]
      }
      ops_set_shelf: {
        Args: { p_item_id: string; p_shelf: string }
        Returns: undefined
      }
      request_return: {
        Args: {
          p_order_id: string
          p_reason: string
          p_description?: string | null
          p_photos?: string[] | null
        }
        Returns: string
      }
      ops_resolve_return: {
        Args: {
          p_return_id: string
          p_approve: boolean
          p_refund?: number | null
          p_note?: string | null
        }
        Returns: undefined
      }
      release_due_payouts: { Args: Record<string, never>; Returns: number }
      ops_resolve_unsold: {
        Args: { p_item_id: string; p_action: string; p_amount?: number | null }
        Returns: undefined
      }
      seller_update_item: {
        Args: {
          p_item_id: string
          p_min_price?: number | null
          p_pref?: string | null
          p_auto_accept?: number | null
        }
        Returns: undefined
      }
      seller_withdraw_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      ops_accept_offer: { Args: { p_offer_id: string }; Returns: string }
      ops_decline_offer: { Args: { p_offer_id: string }; Returns: undefined }
      ops_dispatch_job: {
        Args: {
          p_job_id: string
          p_driver_id?: string | null
          p_carrier_id?: string | null
          p_tracking_ref?: string | null
        }
        Returns: undefined
      }
      ops_schedule_job: {
        Args: { p_job_id: string; p_date: string; p_slot?: string | null; p_sequence?: number | null }
        Returns: undefined
      }
      advance_job: {
        Args: {
          p_job_id: string
          p_status: Database["public"]["Enums"]["logistics_job_status"]
          p_notes?: string | null
          p_proof_url?: string | null
          p_failure_reason?: string | null
        }
        Returns: undefined
      }
      ops_assign_job: {
        Args: { p_job_id: string; p_driver_id: string }
        Returns: undefined
      }
      ops_set_job_status: {
        Args: {
          p_job_id: string
          p_status: Database["public"]["Enums"]["logistics_job_status"]
        }
        Returns: undefined
      }
      request_payout: {
        Args: { p_amount: number; p_method?: string }
        Returns: string
      }
      ops_process_payout: {
        Args: { p_payout_id: string; p_status: string }
        Returns: undefined
      }
      ops_set_price: {
        Args: { p_item_id: string; p_price: number }
        Returns: undefined
      }
      ops_set_order_status: {
        Args: { p_order_id: string; p_status: Database["public"]["Enums"]["order_status"] }
        Returns: undefined
      }
      ops_list_users: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          balance: number
          items_count: number
          orders_count: number
          roles: string[]
        }[]
      }
      ops_set_staff_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_grant: boolean
        }
        Returns: undefined
      }
      ops_grant_staff_by_email: {
        Args: { p_email: string; p_role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      ops_get_customer: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          created_at: string
          balance: number
          roles: string[]
        }[]
      }
      record_item_save: {
        Args: { p_item_id: string; p_delta: number }
        Returns: undefined
      }
      toggle_saved_item: {
        Args: { p_item_id: string; p_saved: boolean }
        Returns: boolean
      }
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
        | "arrived"
        | "completed"
        | "failed"
      logistics_job_type:
        | "pickup_intake"
        | "pickup_on_sale"
        | "delivery"
        | "visit"
        | "return_pickup"
        | "return_to_seller"
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
