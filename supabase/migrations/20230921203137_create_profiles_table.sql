-- create profiles
create table
  public.profiles (
    id uuid not null,
    username text null,
    country text null,
    created_at timestamp with time zone null default now(),
    constraint profiles_pkey primary key (id),
    constraint profiles_username_key unique (username),
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.profiles enable row level security;

-- set policies
create policy "Profiles are viewable by everyone." on profiles for
select
  using (true);

create policy "Users can insert their own profile." on profiles for insert
with
  check (auth.uid () = id);

create policy "Users can update own profile." on profiles for
update using (auth.uid () = id);

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