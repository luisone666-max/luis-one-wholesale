export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_zh: string | null;
          slug: string;
          parent_id: string | null;
          level: number;
          icon_url: string | null;
          image_url: string | null;
          active: boolean | null;
          show_on_homepage: boolean | null;
          show_in_navigation: boolean | null;
          sort_order: number | null;
          template_type: string | null;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name_en: string;
          name_zh?: string | null;
          slug: string;
          parent_id?: string | null;
          level?: number;
          icon_url?: string | null;
          image_url?: string | null;
          active?: boolean | null;
          show_on_homepage?: boolean | null;
          show_in_navigation?: boolean | null;
          sort_order?: number | null;
          template_type?: string | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          category_id: string | null;
          subcategory_id: string | null;
          child_category_id: string | null;
          brand: string | null;
          model: string | null;
          moq: number | null;
          retail_price: number | null;
          stock_status: string | null;
          lead_time: string | null;
          image_url: string | null;
          description: string | null;
          supplier_notes: string | null;
          internal_cost_notes: string | null;
          admin_notes: string | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          slug: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          child_category_id?: string | null;
          brand?: string | null;
          model?: string | null;
          moq?: number | null;
          retail_price?: number | null;
          stock_status?: string | null;
          lead_time?: string | null;
          image_url?: string | null;
          description?: string | null;
          supplier_notes?: string | null;
          internal_cost_notes?: string | null;
          admin_notes?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          image_url: string;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          image_url: string;
          sort_order?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_price_tiers: {
        Row: {
          id: string;
          product_id: string | null;
          variant_id: string | null;
          min_qty: number;
          max_qty: number | null;
          unit_price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          min_qty: number;
          max_qty?: number | null;
          unit_price: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_price_tiers"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          variant_name: string;
          variant_sku: string | null;
          model: string | null;
          fits: string | null;
          image_url: string | null;
          moq: number | null;
          stock_status: string | null;
          lead_time: string | null;
          active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_name: string;
          variant_sku?: string | null;
          model?: string | null;
          fits?: string | null;
          image_url?: string | null;
          moq?: number | null;
          stock_status?: string | null;
          lead_time?: string | null;
          active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      product_variant_price_tiers: {
        Row: {
          id: string;
          variant_id: string;
          min_qty: number;
          max_qty: number | null;
          unit_price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          variant_id: string;
          min_qty: number;
          max_qty?: number | null;
          unit_price: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_variant_price_tiers"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          name: string;
          phone: string | null;
          facebook_name: string | null;
          messenger_link: string | null;
          location: string | null;
            business_type: string | null;
            status: string | null;
            points_balance: number;
            lifetime_points: number;
            created_at: string | null;
          };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          name: string;
          phone?: string | null;
          facebook_name?: string | null;
          messenger_link?: string | null;
          location?: string | null;
            business_type?: string | null;
            status?: string | null;
            points_balance?: number;
            lifetime_points?: number;
            created_at?: string | null;
          };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_no: string;
          customer_id: string | null;
          product_total: number | null;
          order_status: string | null;
          payment_status: string | null;
          receiver_name: string | null;
          receiver_phone: string | null;
          receiving_method: string | null;
          complete_address: string | null;
          shipping_fee_payment_method: string | null;
          shipping_fee_amount: number | null;
          shipping_fee_status: string | null;
          order_notes: string | null;
          admin_notes: string | null;
          sales_admin_user_id: string | null;
          sales_name_snapshot: string | null;
          sales_assigned_at: string | null;
          sales_assigned_by_admin_user_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_no: string;
          customer_id?: string | null;
          product_total?: number | null;
          order_status?: string | null;
          payment_status?: string | null;
          receiver_name?: string | null;
          receiver_phone?: string | null;
          receiving_method?: string | null;
          complete_address?: string | null;
          shipping_fee_payment_method?: string | null;
          shipping_fee_amount?: number | null;
          shipping_fee_status?: string | null;
          order_notes?: string | null;
          admin_notes?: string | null;
          sales_admin_user_id?: string | null;
          sales_name_snapshot?: string | null;
          sales_assigned_at?: string | null;
          sales_assigned_by_admin_user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          variant_id: string | null;
          variant_name_snapshot: string | null;
          variant_sku_snapshot: string | null;
          product_name_snapshot: string | null;
          sku_snapshot: string | null;
          quantity: number;
          unit_price_snapshot: number;
          subtotal: number;
          supplier_notes_snapshot: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          variant_name_snapshot?: string | null;
          variant_sku_snapshot?: string | null;
          product_name_snapshot?: string | null;
          sku_snapshot?: string | null;
          quantity: number;
          unit_price_snapshot: number;
          subtotal: number;
          supplier_notes_snapshot?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      payment_records: {
        Row: {
          id: string;
          order_id: string | null;
          payment_method: string | null;
          amount: number | null;
          reference_no: string | null;
          proof_image_url: string | null;
          status: string | null;
          created_at: string | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          payment_method?: string | null;
          amount?: number | null;
          reference_no?: string | null;
          proof_image_url?: string | null;
          status?: string | null;
          created_at?: string | null;
          verified_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payment_records"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
      cash_drawer_sessions: {
        Row: {
          id: string;
          business_date: string;
          cashier_admin_user_id: string | null;
          cashier_name_snapshot: string | null;
          opening_cash: number;
          expected_cash: number | null;
          actual_cash: number | null;
          difference_amount: number | null;
          status: string;
          opening_notes: string | null;
          closing_notes: string | null;
          opened_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_date: string;
          cashier_admin_user_id?: string | null;
          cashier_name_snapshot?: string | null;
          opening_cash?: number;
          expected_cash?: number | null;
          actual_cash?: number | null;
          difference_amount?: number | null;
          status?: string;
          opening_notes?: string | null;
          closing_notes?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cash_drawer_sessions"]["Insert"]>;
        Relationships: [];
      };
      cash_drawer_entries: {
        Row: {
          id: string;
          session_id: string;
          entry_type: string;
          amount: number;
          reason: string;
          notes: string | null;
          created_by_admin_user_id: string | null;
          created_by_name_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          entry_type: string;
          amount: number;
          reason: string;
          notes?: string | null;
          created_by_admin_user_id?: string | null;
          created_by_name_snapshot?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cash_drawer_entries"]["Insert"]>;
        Relationships: [];
      };
      pos_sales: {
        Row: {
          id: string;
          sale_no: string;
          salesperson_admin_user_id: string | null;
          salesperson_employee_no: string | null;
          salesperson_name_snapshot: string | null;
          customer_id: string | null;
          customer_name_snapshot: string | null;
          customer_phone_snapshot: string | null;
          customer_is_member: boolean | null;
          payment_method: string;
          product_total: number;
          discount_amount: number;
          total_amount: number;
          status: string;
          price_change_notes: string | null;
          sale_notes: string | null;
          cashier_admin_user_id: string | null;
          cashier_name_snapshot: string | null;
          cashier_confirmed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sale_no: string;
          salesperson_admin_user_id?: string | null;
          salesperson_employee_no?: string | null;
          salesperson_name_snapshot?: string | null;
          customer_id?: string | null;
          customer_name_snapshot?: string | null;
          customer_phone_snapshot?: string | null;
          customer_is_member?: boolean | null;
          payment_method?: string;
          product_total?: number;
          discount_amount?: number;
          total_amount?: number;
          status?: string;
          price_change_notes?: string | null;
          sale_notes?: string | null;
          cashier_admin_user_id?: string | null;
          cashier_name_snapshot?: string | null;
          cashier_confirmed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pos_sales"]["Insert"]>;
        Relationships: [];
      };
      pos_sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string | null;
          variant_id: string | null;
          item_name_snapshot: string;
          sku_snapshot: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          item_name_snapshot: string;
          sku_snapshot?: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pos_sale_items"]["Insert"]>;
        Relationships: [];
      };
      pos_payment_confirmations: {
        Row: {
          id: string;
          sale_id: string;
          cashier_admin_user_id: string | null;
          cashier_name_snapshot: string | null;
          payment_method: string;
          amount: number;
          reference_no: string | null;
          notes: string | null;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          sale_id: string;
          cashier_admin_user_id?: string | null;
          cashier_name_snapshot?: string | null;
          payment_method: string;
          amount: number;
          reference_no?: string | null;
          notes?: string | null;
          confirmed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pos_payment_confirmations"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      customer_products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          category_id: string | null;
          subcategory_id: string | null;
          child_category_id: string | null;
          brand: string | null;
          model: string | null;
          moq: number | null;
          stock_status: string | null;
          lead_time: string | null;
          image_url: string | null;
          description: string | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
