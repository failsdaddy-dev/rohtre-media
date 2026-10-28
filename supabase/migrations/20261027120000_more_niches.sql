-- More niches for landing pages (2026-10-27, founder's request): the common
-- D2C categories, each with a few sub-niches (R6: a sub-niche gets its own
-- pages, e.g. /lp/meta-ads-skincare-brands-india). headline_label is the word
-- used in "Meta Ads for <headline_label> Brands in India". Safe to re-run:
-- existing slugs are left as they are.

insert into public.dimension_values (type_key, slug, label, headline_label, attrs, sort) values
  ('niche', 'beauty', 'Beauty & personal care', 'Beauty', '{}', 20),
  ('niche', 'health-wellness', 'Health & wellness', 'Health & Wellness', '{}', 30),
  ('niche', 'food-beverage', 'Food & beverage', 'Food & Beverage', '{}', 40),
  ('niche', 'home-living', 'Home & living', 'Home & Living', '{}', 50),
  ('niche', 'electronics', 'Electronics & gadgets', 'Electronics', '{}', 60),
  ('niche', 'kids-baby', 'Kids & baby', 'Kids & Baby', '{}', 70),
  ('niche', 'pet-care', 'Pet care', 'Pet Care', '{}', 80),
  ('niche', 'sports-fitness', 'Sports & fitness', 'Sports & Fitness', '{}', 90),
  ('niche', 'ecommerce', 'E-commerce (all categories)', 'E-commerce', '{}', 100)
on conflict (type_key, slug) do nothing;

insert into public.dimension_values (type_key, parent_id, slug, label, headline_label, sort)
select 'niche', p.id, v.slug, v.label, v.headline_label, v.sort
from public.dimension_values p
join (values
  ('fashion', 'ethnic-wear', 'Ethnic wear', 'Ethnic Wear', 14),
  ('fashion', 'bags-accessories', 'Bags & accessories', 'Accessories', 15),
  ('fashion', 'watches', 'Watches', 'Watch', 16),
  ('beauty', 'skincare', 'Skincare', 'Skincare', 21),
  ('beauty', 'haircare', 'Haircare', 'Haircare', 22),
  ('beauty', 'cosmetics', 'Cosmetics & makeup', 'Cosmetics', 23),
  ('beauty', 'fragrance', 'Fragrance', 'Fragrance', 24),
  ('health-wellness', 'supplements', 'Supplements & nutrition', 'Supplement', 31),
  ('health-wellness', 'ayurveda', 'Ayurveda & herbal', 'Ayurvedic', 32),
  ('food-beverage', 'snacks', 'Snacks & packaged food', 'Snack', 41),
  ('food-beverage', 'beverages', 'Beverages, tea & coffee', 'Beverage', 42),
  ('home-living', 'home-decor', 'Home decor', 'Home Decor', 51),
  ('home-living', 'furniture', 'Furniture', 'Furniture', 52),
  ('home-living', 'kitchenware', 'Kitchen & dining', 'Kitchenware', 53),
  ('electronics', 'mobile-accessories', 'Mobile accessories', 'Mobile Accessories', 61),
  ('electronics', 'audio-wearables', 'Audio & wearables', 'Audio & Wearables', 62),
  ('kids-baby', 'toys', 'Toys', 'Toy', 71),
  ('kids-baby', 'baby-care', 'Baby care', 'Baby Care', 72)
) as v (parent_slug, slug, label, headline_label, sort)
  on p.type_key = 'niche' and p.slug = v.parent_slug
on conflict (type_key, slug) do nothing;
