export interface User {
  business: number;
  created_at: string;
  email: string | null;
  first_name: string;
  is_admin: boolean;
  last_name: string;
  microsoft_id: string;
  profile_picture: string | null;
  user_followers: string;
  user_id: number;
}