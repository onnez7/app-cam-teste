// 📁 src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://pfjqttbdxwsvkmtnfwtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmanF0dGJkeHdzdmttdG5md3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjA1ODQsImV4cCI6MjA2MjAzNjU4NH0.paABiUZmRabnudg-P9n2v6QzmwuEMLX2uV5_W-3J0Wc'
);
