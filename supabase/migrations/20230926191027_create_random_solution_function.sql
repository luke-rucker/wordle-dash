create
or replace function public.random_solution () returns table (word text, wordle_solution date) as $$
begin
  return query
    select solutions.word, solutions.wordle_solution
    from public.solutions
    order by random()
    limit 1;
end;
$$ language plpgsql security invoker;