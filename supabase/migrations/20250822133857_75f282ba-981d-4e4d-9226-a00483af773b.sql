-- Add unique constraint to cards table to support upsert operations
-- This will allow the refresh-cards function to work properly
ALTER TABLE public.cards 
ADD CONSTRAINT cards_user_dashboard_type_title_unique 
UNIQUE (user_id, dashboard_id, type, title);