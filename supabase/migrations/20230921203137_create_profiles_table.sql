-- create profiles
create table
  public.profiles (
    id uuid not null,
    username text null,
    country text null,
    dash_wins bigint null default 0,
    dash_losses bigint null default 0,
    coop_wins bigint null default 0,
    coop_losses bigint null default 0,
    streak bigint null default 0,
    created_at timestamp with time zone null default now(),
    constraint profiles_pkey primary key (id),
    constraint profiles_username_key unique (username),
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.profiles enable row level security;

create
or replace function public.is_not_updating_stats (
  _id UUID,
  _dash_wins bigint,
  _dash_losses bigint,
  _coop_wins bigint,
  _coop_losses bigint,
  _streak bigint
) returns boolean as $$
with original_row as (
  select dash_wins, dash_losses, coop_wins, coop_losses, streak
  from profiles
  where profiles.id = _id
)
select(
    (select dash_wins from original_row) = _dash_wins and
    (select dash_losses from original_row) = _dash_losses and
    (select coop_wins from original_row) = _coop_wins and
    (select coop_losses from original_row) = _coop_losses and
    (select streak from original_row) = _streak
)
$$ language sql security invoker;

-- set policies
create policy "Profiles are viewable by everyone." on profiles for
select
  using (true);

create policy "Users can insert their own profile." on profiles for insert
with
  check (
    auth.uid () = id
    and is_not_updating_stats (
      id,
      dash_wins,
      dash_losses,
      coop_wins,
      coop_losses,
      streak
    )
  );

create policy "Users can update own profile." on profiles for
update using (
  auth.uid () = id
  and is_not_updating_stats (
    id,
    dash_wins,
    dash_losses,
    coop_wins,
    coop_losses,
    streak
  )
);

-- inserts a row into public.profiles
create function public.handle_new_user () returns trigger language plpgsql security definer
set
  search_path = public as $$ begin
insert into
  public.profiles (id)
values
  (new.id);

return new;

end;

$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();