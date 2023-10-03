import { CoopGameAnimation, DashGameAnimation } from '@/components/animations'
import { Cell } from '@/components/cell'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Guess } from '@party/lib/shared'
import type { LetterStatus } from '@party/lib/words/compare'
import { useLocation } from 'react-router-dom'

export function Help() {
  const location = useLocation()

  return (
    <div className="flex-grow container py-6 md:py-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Help</h2>

        <p className="text-muted-foreground">Learn how to play Wordle Dash</p>
      </div>

      <Separator className="my-6" />

      <div className="max-w-lg">
        <Accordion
          type="single"
          collapsible
          defaultValue={location.state?.section}
        >
          <AccordionItem value="coop">
            <AccordionTrigger>
              <h3 className="text-lg font-medium">Co-Op Mode</h3>
            </AccordionTrigger>

            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-6">
                Take turns guessing the hidden word with your opponent.
              </p>

              <CoopGameAnimation />

              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  Work together with your opponent to guess the hidden word.
                </li>
                <li>Take turns making guesses.</li>
                <li>
                  If there's a time limit, be sure to make your guess in time.
                </li>
                <li>Whoever guesses the word first, wins.</li>
                <li>
                  There is no limit on the number of guesses you and your
                  opponent can make.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dash">
            <AccordionTrigger>
              <h3 className="text-lg font-medium">Dash Mode</h3>
            </AccordionTrigger>

            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-6">
                Race against your opponent in separate boards.
              </p>

              <DashGameAnimation />

              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Race against your opponent to guess the hidden word.</li>
                <li>
                  Guess as fast as you can! No need to take turns with your
                  opponent.
                </li>
                <li>
                  If there's a time limit, be sure to make your guess in time.
                </li>
                <li>Whoever guesses the word first, wins.</li>
                <li>
                  You and your opponent each get six guesses. If you run out of
                  guesses, your opponent wins.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="wordle">
            <AccordionTrigger>
              <h3 className="text-lg font-medium">Wordle Rules</h3>
            </AccordionTrigger>

            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-6">
                Regardless of the mode you play, Wordle rules apply.
              </p>

              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Each guess must be a valid 5 letter word.</li>
                <li>
                  The tiles will change color to show how close your guess was
                  to the hidden word.
                </li>
              </ul>

              <h4 className="font-medium mb-4">Examples</h4>

              <ul className="[&>li]:mt-6">
                <li>
                  <CompletedRow
                    guess={{
                      raw: 'stone',
                      computed: ['c', 'a', 'a', 'a', 'a'],
                    }}
                  />
                  <p className="mt-2">
                    <strong>S</strong> is in the word and in the correct spot.
                  </p>
                </li>

                <li>
                  <CompletedRow
                    guess={{
                      raw: 'coach',
                      computed: ['a', 'p', 'a', 'a', 'a'],
                    }}
                  />
                  <p className="mt-2">
                    <strong>O</strong> is in the word and in the wrong spot.
                  </p>
                </li>

                <li>
                  <CompletedRow
                    guess={{
                      raw: 'music',
                      computed: [
                        'typed',
                        'typed',
                        'typed',
                        'a',
                        'typed',
                      ] as Array<LetterStatus>,
                    }}
                  />
                  <p className="mt-2">
                    <strong>I</strong> is not in the word in any spot.
                  </p>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <section>
          <header>
            <h3 className="text-lg font-medium mt-8">Feedback</h3>
          </header>

          <p className="text-sm text-muted-foreground mb-6">
            Have any ideas on how we can improve?
          </p>

          <p>
            Drop us a line at{' '}
            <a href="mailto:hello@wordledash.io" className="underline">
              hello@wordledash.io
            </a>{' '}
            :)
          </p>
        </section>
      </div>
    </div>
  )
}

function Row({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('flex gap-1', className)}>{children}</div>
}

function CompletedRow({ guess }: { guess: Guess }) {
  return (
    <Row>
      {guess.computed.map((status, index) => (
        <Cell key={index} letter={guess.raw[index]} status={status} />
      ))}
    </Row>
  )
}
