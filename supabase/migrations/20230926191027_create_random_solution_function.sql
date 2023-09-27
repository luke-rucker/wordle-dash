create
or replace function public.random_solution () returns text language plpgsql as $$
  declare
    solution text;
  begin
    select word into solution
    from public.solutions
    order by random()
    limit 1;

    return solution;
  end;
$$