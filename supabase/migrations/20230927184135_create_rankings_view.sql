create view
  public.rankings as
select
  stat.id,
  stat.username,
  stat.country,
  stat.streak,
  stat.wins,
  stat.losses,
  rank() over (
    order by
      stat.wins desc,
      stat.created_at asc
  ) AS rank
from
  (
    select
      id,
      username,
      country,
      streak,
      coop_wins + dash_wins as wins,
      coop_losses + dash_losses as losses,
      created_at
    from
      profiles
  ) AS stat
order by
  rank;

create
or replace function public.set_win (user_id uuid, game_type boolean) returns void language plpgsql as $$
  begin
    case game_type
    when true then
      update public.profiles
      set coop_wins = coop_wins + 1, streak = streak + 1
      where id = user_id;
    when false then
      update public.profiles
      set dash_wins = dash_wins + 1, streak = streak + 1
      where id = user_id;
    end case;
  end;
$$;

revoke
execute on function set_win
from
  public;

grant
execute on function set_win to service_role;

create
or replace function public.set_loss (user_id uuid, game_type boolean) returns void language plpgsql as $$
  begin
    case game_type
    when true then
      update public.profiles
      set coop_losses = coop_losses + 1, streak = 0
      where id = user_id;
    when false then
      update public.profiles
      set dash_losses = dash_losses + 1, streak = 0
      where id = user_id;
    end case;
  end;
$$;

revoke
execute on function set_loss
from
  public;

grant
execute on function set_loss to service_role;