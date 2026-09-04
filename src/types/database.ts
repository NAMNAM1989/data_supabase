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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          app_name: string
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          app_name?: string
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          app_name?: string
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      commodities: {
        Row: {
          category: string | null
          code: string | null
          contains_battery: boolean
          created_at: string
          english_name: string | null
          hs_code: string | null
          id: string
          is_dg: boolean
          is_liquid: boolean
          metadata: Json
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          contains_battery?: boolean
          created_at?: string
          english_name?: string | null
          hs_code?: string | null
          id?: string
          is_dg?: boolean
          is_liquid?: boolean
          metadata?: Json
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          contains_battery?: boolean
          created_at?: string
          english_name?: string | null
          hs_code?: string | null
          id?: string
          is_dg?: boolean
          is_liquid?: boolean
          metadata?: Json
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      customer_commodities: {
        Row: {
          commodity_id: string
          created_at: string
          custom_description: string | null
          customer_id: string
          id: string
          is_default: boolean
          last_used_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          usage_count: number
        }
        Insert: {
          commodity_id: string
          created_at?: string
          custom_description?: string | null
          customer_id: string
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          usage_count?: number
        }
        Update: {
          commodity_id?: string
          created_at?: string
          custom_description?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_commodities_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "commodities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_commodities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_drivers: {
        Row: {
          created_at: string
          customer_id: string
          driver_id: string
          id: string
          is_default: boolean
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          driver_id: string
          id?: string
          is_default?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          driver_id?: string
          id?: string
          is_default?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_drivers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_drivers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_parties: {
        Row: {
          created_at: string
          customer_id: string
          destination_id: string | null
          id: string
          is_default: boolean
          party_id: string
          role: Database["public"]["Enums"]["party_role"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          destination_id?: string | null
          id?: string
          is_default?: boolean
          party_id: string
          role: Database["public"]["Enums"]["party_role"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          destination_id?: string | null
          id?: string
          is_default?: boolean
          party_id?: string
          role?: Database["public"]["Enums"]["party_role"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_parties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parties_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parties_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vehicles: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          code: string
          created_at: string
          customer_type: string | null
          email: string | null
          id: string
          metadata: Json
          name: string
          notes: string | null
          phone: string | null
          short_name: string | null
          status: Database["public"]["Enums"]["record_status"]
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          phone?: string | null
          short_name?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          phone?: string | null
          short_name?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_esid_profiles: {
        Row: {
          created_at: string
          customer_id: string
          declarant_id_number: string | null
          declarant_name: string | null
          declarant_phone: string | null
          default_agent_party_id: string | null
          default_is_consol: boolean
          default_notify_party_id: string | null
          default_origin_id: string | null
          default_other_handling: boolean
          default_payment_term: string
          metadata: Json
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          declarant_id_number?: string | null
          declarant_name?: string | null
          declarant_phone?: string | null
          default_agent_party_id?: string | null
          default_is_consol?: boolean
          default_notify_party_id?: string | null
          default_origin_id?: string | null
          default_other_handling?: boolean
          default_payment_term?: string
          metadata?: Json
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          declarant_id_number?: string | null
          declarant_name?: string | null
          declarant_phone?: string | null
          default_agent_party_id?: string | null
          default_is_consol?: boolean
          default_notify_party_id?: string | null
          default_origin_id?: string | null
          default_other_handling?: boolean
          default_payment_term?: string
          metadata?: Json
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_esid_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_esid_profiles_default_agent_party_id_fkey"
            columns: ["default_agent_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_esid_profiles_default_notify_party_id_fkey"
            columns: ["default_notify_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_esid_profiles_default_origin_id_fkey"
            columns: ["default_origin_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          city_name: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          iata_code: string
          id: string
          metadata: Json
          region: string | null
          status: Database["public"]["Enums"]["record_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          city_name?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          iata_code: string
          id?: string
          metadata?: Json
          region?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          city_name?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          iata_code?: string
          id?: string
          metadata?: Json
          region?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_vehicles: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          is_preferred: boolean
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          is_preferred?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          is_preferred?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          code: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          full_name: string
          id: string
          license_class: string | null
          license_expiry: string | null
          license_number: string | null
          metadata: Json
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          full_name: string
          id?: string
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          metadata?: Json
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          full_name?: string
          id?: string
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          metadata?: Json
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country_code: string | null
          created_at: string
          email: string | null
          fax: string | null
          id: string
          metadata: Json
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: Database["public"]["Enums"]["record_status"]
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          fax?: string | null
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          fax?: string | null
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          metadata: Json
          model: string | null
          notes: string | null
          payload_kg: number | null
          plate_display: string | null
          plate_number: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          notes?: string | null
          payload_kg?: number | null
          plate_display?: string | null
          plate_number: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          notes?: string | null
          payload_kg?: number | null
          plate_display?: string | null
          plate_number?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "ADMIN" | "OPERATOR" | "VIEWER" | "INTEGRATION"
      customer_type: "FORWARDER" | "DIRECT_SHIPPER" | "AGENT" | "OTHER"
      party_role: "SHIPPER" | "CONSIGNEE" | "AGENT" | "NOTIFY"
      record_status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
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
      app_role: ["ADMIN", "OPERATOR", "VIEWER", "INTEGRATION"],
      customer_type: ["FORWARDER", "DIRECT_SHIPPER", "AGENT", "OTHER"],
      party_role: ["SHIPPER", "CONSIGNEE", "AGENT", "NOTIFY"],
      record_status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
    },
  },
} as const
