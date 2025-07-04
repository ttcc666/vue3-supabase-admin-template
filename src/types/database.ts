/**
 * Supabase 数据库类型定义
 * 这个文件定义了数据库表结构的 TypeScript 类型
 */

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          category: 'system' | 'notification' | 'privacy'
          setting_key: string
          setting_value: any
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'system' | 'notification' | 'privacy'
          setting_key: string
          setting_value: any
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'system' | 'notification' | 'privacy'
          setting_key?: string
          setting_value?: any
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          phone: string | null
          website: string | null
          bio: string | null
          avatar_url: string | null
          birthday: string | null
          country: string | null
          city: string | null
          address: string | null
          github_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          website?: string | null
          bio?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          city?: string | null
          address?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          website?: string | null
          bio?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          city?: string | null
          address?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      profiles_with_stats: {
        Row: {
          id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          phone: string | null
          website: string | null
          bio: string | null
          avatar_url: string | null
          birthday: string | null
          country: string | null
          city: string | null
          address: string | null
          github_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          created_at: string
          updated_at: string
          age: number | null
          activity_status: 'active' | 'inactive' | 'dormant' | null
        }
      }
    }
    Functions: {
      get_profile: {
        Args: {
          user_id?: string
        }
        Returns: {
          id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          phone: string | null
          website: string | null
          bio: string | null
          avatar_url: string | null
          birthday: string | null
          country: string | null
          city: string | null
          address: string | null
          github_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          created_at: string
          updated_at: string
          age: number | null
          activity_status: 'active' | 'inactive' | 'dormant' | null
        }[]
      }
    }
    Enums: {
      setting_category: 'system' | 'notification' | 'privacy'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
