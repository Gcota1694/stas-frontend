import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jilolgiociwqyjyrqeth.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbG9sZ2lvY2l3cXlqeXJxZXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzgwMDQsImV4cCI6MjA5NDgxNDAwNH0.Se2TCOycpv0WJn9LvvRKM4XH00Rl3IfcNd42YShqlrg'

export const supabase = createClient(supabaseUrl, supabaseKey)