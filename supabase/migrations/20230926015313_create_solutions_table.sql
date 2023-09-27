create table
  public.solutions (
    id bigint primary key generated always as identity,
    word text unique not null,
    wordle_solution date null,
    created_at timestamp with time zone null default now()
  );

alter table public.solutions enable row level security;

create policy "Solutions are viewable by everyone." on solutions for
select
  using (true);