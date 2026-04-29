export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number;
          id: string;
          mime_type: string;
          ticket_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size: number;
          id?: string;
          mime_type: string;
          ticket_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          ticket_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_deleted: boolean;
          reply_to_id: string | null;
          ticket_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          reply_to_id?: string | null;
          ticket_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          reply_to_id?: string | null;
          ticket_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          project_id: string;
          status: Database["public"]["Enums"]["invitation_status"];
          token: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          project_id: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          project_id?: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_settings: {
        Row: {
          created_at: string;
          email_assigned: boolean;
          email_assignee_changed: boolean;
          email_comment_added: boolean;
          email_deadline: boolean;
          email_mention: boolean;
          email_priority_changed: boolean;
          email_status_changed: boolean;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_assigned?: boolean;
          email_assignee_changed?: boolean;
          email_comment_added?: boolean;
          email_deadline?: boolean;
          email_mention?: boolean;
          email_priority_changed?: boolean;
          email_status_changed?: boolean;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email_assigned?: boolean;
          email_assignee_changed?: boolean;
          email_comment_added?: boolean;
          email_deadline?: boolean;
          email_mention?: boolean;
          email_priority_changed?: boolean;
          email_status_changed?: boolean;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string;
          email_sent_at: string | null;
          id: string;
          is_read: boolean;
          metadata: Json | null;
          ticket_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          email_sent_at?: string | null;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          ticket_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          email_sent_at?: string | null;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          ticket_id?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          ai_api_key: string | null;
          ai_endpoint_url: string | null;
          ai_model_name: string | null;
          ai_provider: Database["public"]["Enums"]["ai_provider_type"] | null;
          avatar_file_path: string | null;
          created_at: string;
          email: string;
          id: string;
          slack_webhook_url: string | null;
          username: string;
        };
        Insert: {
          ai_api_key?: string | null;
          ai_endpoint_url?: string | null;
          ai_model_name?: string | null;
          ai_provider?: Database["public"]["Enums"]["ai_provider_type"] | null;
          avatar_file_path?: string | null;
          created_at?: string;
          email: string;
          id: string;
          slack_webhook_url?: string | null;
          username: string;
        };
        Update: {
          ai_api_key?: string | null;
          ai_endpoint_url?: string | null;
          ai_model_name?: string | null;
          ai_provider?: Database["public"]["Enums"]["ai_provider_type"] | null;
          avatar_file_path?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          slack_webhook_url?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          created_at: string;
          id: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          project_id: string;
          role?: Database["public"]["Enums"]["project_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          project_id?: string;
          role?: Database["public"]["Enums"]["project_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          project_id: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          project_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tags_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_activities: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"];
          created_at: string;
          id: string;
          new_value: string | null;
          old_value: string | null;
          ticket_id: string;
          user_id: string | null;
        };
        Insert: {
          action: Database["public"]["Enums"]["activity_action"];
          created_at?: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
          ticket_id: string;
          user_id?: string | null;
        };
        Update: {
          action?: Database["public"]["Enums"]["activity_action"];
          created_at?: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
          ticket_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_activities_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_tags: {
        Row: {
          tag_id: string;
          ticket_id: string;
        };
        Insert: {
          tag_id: string;
          ticket_id: string;
        };
        Update: {
          tag_id?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_tags_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_watches: {
        Row: {
          created_at: string;
          id: string;
          ticket_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ticket_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          ticket_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_watches_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_watches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          assignee_id: string | null;
          category: Database["public"]["Enums"]["ticket_category"];
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          parent_id: string | null;
          priority: Database["public"]["Enums"]["ticket_priority"];
          project_id: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["ticket_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          assignee_id?: string | null;
          category?: Database["public"]["Enums"]["ticket_category"];
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          parent_id?: string | null;
          priority?: Database["public"]["Enums"]["ticket_priority"];
          project_id: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string | null;
          category?: Database["public"]["Enums"]["ticket_category"];
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          parent_id?: string | null;
          priority?: Database["public"]["Enums"]["ticket_priority"];
          project_id?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { p_token: string; p_user_id: string };
        Returns: undefined;
      };
      can_access_attachment_ticket: {
        Args: { ticket_id: string };
        Returns: boolean;
      };
      can_access_ticket: { Args: { p_ticket_id: string }; Returns: boolean };
      create_invitation: {
        Args: { p_email: string; p_project_id: string };
        Returns: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          project_id: string;
          status: Database["public"]["Enums"]["invitation_status"];
          token: string;
        };
        SetofOptions: {
          from: "*";
          to: "invitations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_ticket_watcher_emails: {
        Args: { p_exclude_user_id: string; p_ticket_id: string };
        Returns: {
          email: string;
          user_id: string;
        }[];
      };
      is_email_registered: { Args: { p_email: string }; Returns: boolean };
      is_project_member: { Args: { project_id: string }; Returns: boolean };
      is_project_owner: { Args: { project_id: string }; Returns: boolean };
      notify_watchers: {
        Args: {
          p_actor_id: string;
          p_metadata?: Json;
          p_ticket_id: string;
          p_type: Database["public"]["Enums"]["notification_type"];
        };
        Returns: undefined;
      };
      remove_member_from_project: {
        Args: { p_member_id: string; p_project_id: string; p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      activity_action:
        | "created"
        | "status_changed"
        | "assignee_changed"
        | "priority_changed"
        | "due_date_changed"
        | "start_date_changed"
        | "comment_added"
        | "comment_deleted";
      ai_provider_type: "gemini" | "openrouter";
      invitation_status: "pending" | "accepted" | "expired";
      notification_type:
        | "assigned"
        | "assignee_changed"
        | "comment_added"
        | "status_changed"
        | "priority_changed"
        | "mention"
        | "deadline";
      project_role: "owner" | "member";
      ticket_category: "bug" | "task" | "feature" | "improvement";
      ticket_priority: "low" | "medium" | "high" | "urgent";
      ticket_status: "todo" | "in_progress" | "done";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_action: [
        "created",
        "status_changed",
        "assignee_changed",
        "priority_changed",
        "due_date_changed",
        "start_date_changed",
        "comment_added",
        "comment_deleted",
      ],
      ai_provider_type: ["gemini", "openrouter"],
      invitation_status: ["pending", "accepted", "expired"],
      notification_type: [
        "assigned",
        "assignee_changed",
        "comment_added",
        "status_changed",
        "priority_changed",
        "mention",
        "deadline",
      ],
      project_role: ["owner", "member"],
      ticket_category: ["bug", "task", "feature", "improvement"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["todo", "in_progress", "done"],
    },
  },
} as const;
