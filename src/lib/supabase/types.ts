export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string;
          school_name: string | null;
          npsn: string | null;
          contact_name: string | null;
          email: string;
          phone: string | null;
          address: string | null;
          education_level: string | null;
          principal_name: string | null;
          operator_name: string | null;
          district: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: string;
          school_name?: string | null;
          npsn?: string | null;
          contact_name?: string | null;
          email: string;
          phone?: string | null;
          address?: string | null;
          education_level?: string | null;
          principal_name?: string | null;
          operator_name?: string | null;
          district?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          school_name?: string | null;
          npsn?: string | null;
          contact_name?: string | null;
          email?: string;
          phone?: string | null;
          address?: string | null;
          education_level?: string | null;
          principal_name?: string | null;
          operator_name?: string | null;
          district?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          school_id: string;
          school_name: string;
          topic: string;
          category: string | null;
          date_iso: string;
          session: string;
          status: string;
          timeline: Json;
          goal: string | null;
          notes: string | null;
          cancel_reason: string | null;
          rating: number | null;
          feedback: string | null;
          supervisor_notes: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          school_id: string;
          school_name: string;
          topic: string;
          category?: string | null;
          date_iso: string;
          session: string;
          status?: string;
          timeline?: Json;
          goal?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          rating?: number | null;
          feedback?: string | null;
          supervisor_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          school_name?: string;
          topic?: string;
          category?: string | null;
          date_iso?: string;
          session?: string;
          status?: string;
          timeline?: Json;
          goal?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          rating?: number | null;
          feedback?: string | null;
          supervisor_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          school_id: string;
          booking_id: string | null;
          history_id: string | null;
          file_name: string;
          storage_path: string | null;
          file_size: number | null;
          mime_type: string | null;
          stage: string;
          review_status: string | null;
          reviewer_notes: string | null;
          version: number | null;
          parent_doc_id: string | null;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          school_id: string;
          booking_id?: string | null;
          history_id?: string | null;
          file_name: string;
          storage_path?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          stage: string;
          review_status?: string | null;
          reviewer_notes?: string | null;
          version?: number | null;
          parent_doc_id?: string | null;
          uploaded_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          booking_id?: string | null;
          history_id?: string | null;
          file_name?: string;
          storage_path?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          stage?: string;
          review_status?: string | null;
          reviewer_notes?: string | null;
          version?: number | null;
          parent_doc_id?: string | null;
          uploaded_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      histories: {
        Row: {
          id: string;
          school_id: string;
          booking_id: string | null;
          date_iso: string;
          school_name: string;
          session: string;
          title: string;
          description: string;
          status: string;
          follow_up_iso: string | null;
          supervisor_notes: string | null;
          follow_up_done: boolean;
          follow_up_items: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          school_id: string;
          booking_id?: string | null;
          date_iso: string;
          school_name: string;
          session: string;
          title: string;
          description: string;
          status?: string;
          follow_up_iso?: string | null;
          supervisor_notes?: string | null;
          follow_up_done?: boolean;
          follow_up_items?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          booking_id?: string | null;
          date_iso?: string;
          school_name?: string;
          session?: string;
          title?: string;
          description?: string;
          status?: string;
          follow_up_iso?: string | null;
          supervisor_notes?: string | null;
          follow_up_done?: boolean;
          follow_up_items?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_id: string | null;
          reference_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
