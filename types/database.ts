export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          actor_type: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          actor_type: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          actor_type?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          analytics_consent: boolean
          booking_code: string
          charged_amount_piasters: number
          checked_in_at: string | null
          consent_recorded_at: string | null
          created_at: string
          expires_at: string | null
          fx_rate_snapshot_micros: number
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_price_usd_cents: number
          headcount: number
          id: string
          marketing_consent: boolean
          nationality: string
          owner_share_piasters: number
          platform_share_piasters: number
          status: Database["public"]["Enums"]["booking_status"]
          trip_instance_id: string
          updated_at: string
        }
        Insert: {
          analytics_consent?: boolean
          booking_code: string
          charged_amount_piasters: number
          checked_in_at?: string | null
          consent_recorded_at?: string | null
          created_at?: string
          expires_at?: string | null
          fx_rate_snapshot_micros: number
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_price_usd_cents: number
          headcount: number
          id?: string
          marketing_consent?: boolean
          nationality: string
          owner_share_piasters: number
          platform_share_piasters: number
          status?: Database["public"]["Enums"]["booking_status"]
          trip_instance_id: string
          updated_at?: string
        }
        Update: {
          analytics_consent?: boolean
          booking_code?: string
          charged_amount_piasters?: number
          checked_in_at?: string | null
          consent_recorded_at?: string | null
          created_at?: string
          expires_at?: string | null
          fx_rate_snapshot_micros?: number
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guest_price_usd_cents?: number
          headcount?: number
          id?: string
          marketing_consent?: boolean
          nationality?: string
          owner_share_piasters?: number
          platform_share_piasters?: number
          status?: Database["public"]["Enums"]["booking_status"]
          trip_instance_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_instance_id_fkey"
            columns: ["trip_instance_id"]
            isOneToOne: false
            referencedRelation: "trip_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_users: {
        Row: {
          active: boolean
          assigned_yacht_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          assigned_yacht_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean
          assigned_yacht_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_users_assigned_yacht_id_fkey"
            columns: ["assigned_yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_piasters: number
          booking_id: string
          created_at: string
          gateway: string
          gateway_reference: string
          id: string
          raw_gateway_response: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_piasters: number
          booking_id: string
          created_at?: string
          gateway?: string
          gateway_reference: string
          id?: string
          raw_gateway_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_piasters?: number
          booking_id?: string
          created_at?: string
          gateway?: string
          gateway_reference?: string
          id?: string
          raw_gateway_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_instances: {
        Row: {
          capacity: number
          created_at: string
          departure_time: string
          id: string
          seats_booked: number
          status: Database["public"]["Enums"]["trip_instance_status"]
          trip_date: string
          updated_at: string
          yacht_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          departure_time: string
          id?: string
          seats_booked?: number
          status?: Database["public"]["Enums"]["trip_instance_status"]
          trip_date: string
          updated_at?: string
          yacht_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          departure_time?: string
          id?: string
          seats_booked?: number
          status?: Database["public"]["Enums"]["trip_instance_status"]
          trip_date?: string
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_instances_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          active?: boolean
          capacity: number
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      organizer_covers_yacht: {
        Args: {
          target_yacht_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admin_role: "super_admin" | "staff"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "checked_in"
        | "expired"
        | "cancelled"
      payment_status: "initiated" | "succeeded" | "failed"
      trip_instance_status: "scheduled" | "departed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

