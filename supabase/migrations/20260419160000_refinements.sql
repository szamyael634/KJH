-- Add category column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text DEFAULT 'Electronics';

-- Update RLS to ensure category is included (already covered by existing policies, but good to note)

-- Optional: Create a view for easier seller analytics
CREATE OR REPLACE VIEW public.seller_stats AS
SELECT 
    seller_id,
    COUNT(id) as total_sales,
    SUM(price_at_purchase * quantity) as total_revenue
FROM public.order_items
GROUP BY seller_id;
