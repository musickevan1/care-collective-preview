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
      profiles: {
        Row: {
          id: string
          name: string
          is_beta_tester: boolean | null
          is_admin: boolean | null
          location: string | null
          phone: string | null
          created_at: string | null
        }
      }
    }
  }
}
