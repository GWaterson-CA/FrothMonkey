export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auction_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string | null
          id: string
          listing_id: string
          question: string
          questioner_id: string
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          question: string
          questioner_id: string
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          question?: string
          questioner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_questions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_questions_questioner_id_fkey"
            columns: ["questioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string | null
          id: number
          listing_id: string
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string | null
          id?: number
          listing_id: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string | null
          id?: number
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number | null
          parent_id: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          parent_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          parent_id?: string | null
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
      listing_images: {
        Row: {
          id: string
          listing_id: string
          path: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          listing_id: string
          path: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          listing_id?: string
          path?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          anti_sniping_seconds: number
          buy_now_enabled: boolean | null
          buy_now_price: number | null
          category_id: string
          condition: Database["public"]["Enums"]["item_condition"]
          cover_image_url: string | null
          created_at: string | null
          current_price: number
          description: string | null
          end_time: string
          id: string
          location: string
          owner_id: string
          reserve_met: boolean | null
          reserve_price: number | null
          start_price: number
          start_time: string
          status: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          anti_sniping_seconds?: number
          buy_now_price?: number | null
          category_id: string
          condition?: Database["public"]["Enums"]["item_condition"]
          cover_image_url?: string | null
          created_at?: string | null
          current_price?: number
          description?: string | null
          end_time: string
          id?: string
          location?: string
          owner_id: string
          reserve_price?: number | null
          start_price: number
          start_time?: string
          status?: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          anti_sniping_seconds?: number
          buy_now_price?: number | null
          category_id?: string
          condition?: Database["public"]["Enums"]["item_condition"]
          cover_image_url?: string | null
          created_at?: string | null
          current_price?: number
          description?: string | null
          end_time?: string
          id?: string
          location?: string
          owner_id?: string
          reserve_price?: number | null
          start_price?: number
          start_time?: string
          status?: Database["public"]["Enums"]["auction_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bidding_agreement_accepted_at: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          privacy_policy_accepted_at: string | null
          terms_accepted_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bidding_agreement_accepted_at?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          privacy_policy_accepted_at?: string | null
          terms_accepted_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bidding_agreement_accepted_at?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          privacy_policy_accepted_at?: string | null
          terms_accepted_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          buyer_id: string
          created_at: string | null
          final_price: number
          id: string
          listing_id: string
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          final_price: number
          id?: string
          listing_id: string
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          final_price?: number
          id?: string
          listing_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_interest: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          location: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          location: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string | null
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_review_user: {
        Args: {
          transaction_uuid: string
          reviewer_uuid: string
          reviewee_uuid: string
        }
        Returns: boolean
      }
      get_unanswered_questions_count: {
        Args: {
          listing_uuid: string
        }
        Returns: number
      }
      get_user_rating: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
      finalize_auctions: {
        Args: {
          batch_limit?: number
        }
        Returns: number
      }
      min_bid_increment: {
        Args: {
          amount: number
        }
        Returns: number
      }
      next_min_bid: {
        Args: {
          listing_id: string
        }
        Returns: number
      }
      place_bid: {
        Args: {
          listing_id: string
          bid_amount: number
          bidder: string
        }
        Returns: Json
      }
      schedule_auction_finalization: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      auction_status: "draft" | "scheduled" | "live" | "ended" | "cancelled" | "sold"
      item_condition: "new" | "like_new" | "good" | "fair" | "parts"
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
