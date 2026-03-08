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
      activity_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          is_active: boolean
          margin_percent: number
          rate: number
          to_currency: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          from_currency: string
          id?: string
          is_active?: boolean
          margin_percent?: number
          rate: number
          to_currency: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          from_currency?: string
          id?: string
          is_active?: boolean
          margin_percent?: number
          rate?: number
          to_currency?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      fee_config: {
        Row: {
          fee_type: Database["public"]["Enums"]["fee_type"]
          flat_amount: number | null
          id: string
          is_active: boolean
          max_amount: number | null
          min_amount: number | null
          name: string
          percentage: number | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          fee_type?: Database["public"]["Enums"]["fee_type"]
          flat_amount?: number | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number | null
          name: string
          percentage?: number | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          fee_type?: Database["public"]["Enums"]["fee_type"]
          flat_amount?: number | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          percentage?: number | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          config: Json
          id: string
          is_enabled: boolean
          mode: string
          name: string
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: string
          is_enabled?: boolean
          mode?: string
          name: string
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: string
          is_enabled?: boolean
          mode?: string
          name?: string
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string
          country_code: string
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          id_back_url: string | null
          id_front_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_name: string
          middle_name: string | null
          phone: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string
          country_code?: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_name: string
          middle_name?: string | null
          phone?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string
          country_code?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          created_at: string
          description: string
          id: string
          resolved: boolean
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          resolved?: boolean
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          type: Database["public"]["Enums"]["alert_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          resolved?: boolean
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          fee: number
          id: string
          metadata: Json | null
          method: string | null
          provider: string | null
          receiver_user_id: string | null
          receiver_wallet_id: string | null
          reference: string
          sender_user_id: string | null
          sender_wallet_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          method?: string | null
          provider?: string | null
          receiver_user_id?: string | null
          receiver_wallet_id?: string | null
          reference: string
          sender_user_id?: string | null
          sender_wallet_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          method?: string | null
          provider?: string | null
          receiver_user_id?: string | null
          receiver_wallet_id?: string | null
          reference?: string
          sender_user_id?: string | null
          sender_wallet_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_receiver_wallet_id_fkey"
            columns: ["receiver_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_wallet_id_fkey"
            columns: ["sender_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      virtual_cards: {
        Row: {
          card_number: string
          cardholder_name: string
          created_at: string
          cvv: string
          expiry: string
          id: string
          is_frozen: boolean
          provider: string
          provider_ref: string | null
          user_id: string
        }
        Insert: {
          card_number: string
          cardholder_name: string
          created_at?: string
          cvv: string
          expiry: string
          id?: string
          is_frozen?: boolean
          provider?: string
          provider_ref?: string | null
          user_id: string
        }
        Update: {
          card_number?: string
          cardholder_name?: string
          created_at?: string
          cvv?: string
          expiry?: string
          id?: string
          is_frozen?: boolean
          provider?: string
          provider_ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          failed_pin_attempts: number
          id: string
          is_locked: boolean
          pin_hash: string | null
          updated_at: string
          user_id: string
          wallet_number: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          failed_pin_attempts?: number
          id?: string
          is_locked?: boolean
          pin_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_number: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          failed_pin_attempts?: number
          id?: string
          is_locked?: boolean
          pin_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_number?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          destination: string
          id: string
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          destination: string
          id?: string
          method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          destination?: string
          id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_wallet_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_recipient: {
        Args: { lookup_type: string; lookup_value: string }
        Returns: Json
      }
      transfer_funds: {
        Args: {
          p_amount: number
          p_pin?: string
          p_recipient_phone: string
          p_recipient_wallet: string
          p_sender_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_status: "active" | "frozen" | "suspended" | "banned"
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_type:
        | "failed_login"
        | "failed_pin"
        | "suspicious_transaction"
        | "unusual_pattern"
      app_role: "user" | "admin" | "superadmin"
      fee_type: "flat" | "percentage" | "tiered"
      kyc_status: "pending" | "approved" | "rejected"
      ticket_category:
        | "failed_transaction"
        | "login_issue"
        | "payment_dispute"
        | "general"
        | "account_issue"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status: "open" | "in_progress" | "resolved" | "escalated"
      transaction_status:
        | "completed"
        | "pending"
        | "failed"
        | "flagged"
        | "reversed"
      transaction_type:
        | "deposit"
        | "send"
        | "receive"
        | "withdraw"
        | "exchange"
        | "airtime"
      withdrawal_status: "pending" | "approved" | "rejected" | "processing"
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
      account_status: ["active", "frozen", "suspended", "banned"],
      alert_severity: ["low", "medium", "high", "critical"],
      alert_type: [
        "failed_login",
        "failed_pin",
        "suspicious_transaction",
        "unusual_pattern",
      ],
      app_role: ["user", "admin", "superadmin"],
      fee_type: ["flat", "percentage", "tiered"],
      kyc_status: ["pending", "approved", "rejected"],
      ticket_category: [
        "failed_transaction",
        "login_issue",
        "payment_dispute",
        "general",
        "account_issue",
      ],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: ["open", "in_progress", "resolved", "escalated"],
      transaction_status: [
        "completed",
        "pending",
        "failed",
        "flagged",
        "reversed",
      ],
      transaction_type: [
        "deposit",
        "send",
        "receive",
        "withdraw",
        "exchange",
        "airtime",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "processing"],
    },
  },
} as const
