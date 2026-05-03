update public.products
set moq = 1,
    updated_at = now()
where moq is null or moq <> 1;
