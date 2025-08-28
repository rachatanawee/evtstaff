export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      // your tables here
    }
    Views: {
      // your views here
    }
    Functions: {
      // your functions here
    }
  }
}
