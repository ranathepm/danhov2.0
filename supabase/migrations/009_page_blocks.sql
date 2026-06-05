-- ──────────────────────────────────────────────────────────────────────────
-- Page Content CMS — block-based editor.
--
-- Each page (home / engagement / wedding / fine / mens / faq) is a list
-- of ordered, typed blocks. The admin can add / edit / reorder / hide /
-- delete any block. The public site reads visible blocks for the page
-- in position order and renders them with type-specific components.
--
-- Block types:
--   heading      — { text, level: 1|2|3, align: 'left'|'center', eyebrow? }
--   paragraph    — { text, align: 'left'|'center' }
--   image        — { url, alt, caption?, full_width: bool }
--   video        — { url, caption? }  (mp4 file or YouTube/Vimeo URL)
--   cta          — { label, href, style: 'primary'|'secondary' }
--   quote        — { text, attribution? }
--   divider      — {}
--   spacer       — { size: 'sm'|'md'|'lg' }
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists page_blocks (
  id          uuid primary key default gen_random_uuid(),
  page_slug   text not null,
  position    int  not null default 0,
  type        text not null,
  data        jsonb not null default '{}'::jsonb,
  is_visible  boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists page_blocks_page_pos_idx on page_blocks(page_slug, position);

create or replace function set_page_blocks_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists page_blocks_updated_at on page_blocks;
create trigger page_blocks_updated_at before update on page_blocks
  for each row execute function set_page_blocks_updated_at();

alter table page_blocks enable row level security;

drop policy if exists "Anyone reads visible page blocks" on page_blocks;
create policy "Anyone reads visible page blocks"
  on page_blocks for select to anon, authenticated
  using (is_visible = true);

drop policy if exists "Admins read all page blocks" on page_blocks;
create policy "Admins read all page blocks"
  on page_blocks for select to authenticated
  using (auth.uid() in (select user_id from admin_users));

drop policy if exists "Admins manage page blocks" on page_blocks;
create policy "Admins manage page blocks"
  on page_blocks for all to authenticated
  using (auth.uid() in (select user_id from admin_users))
  with check (auth.uid() in (select user_id from admin_users));
