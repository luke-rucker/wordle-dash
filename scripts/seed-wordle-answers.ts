import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import type { Database } from '../src/types/supabase'
import { WORDS } from '../party/lib/words/solutions'

dotenv.config()

const supabase = createClient<Database>(
  process.env.SUPABASE_APP_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  const res = await fetch('https://www.techradar.com/news/past-wordle-answers')
  const html = await res.text()

  const $ = cheerio.load(html)

  const rows: Array<Array<string>> = []

  $(
    'table.table__wrapper.table__wrapper--inbodyContent.table__wrapper--sticky.table__wrapper--divider'
  ).each(function () {
    const table = $(this)

    table.find('tr').each(function () {
      const row = $(this)
      const parsed: Array<string> = []

      row.find('td').each(function () {
        const td = $(this)
        parsed.push(td.text())
      })

      rows.push(parsed)
    })
  })

  const scraped: Array<{ wordle_solution: string; word: string }> = []

  rows.forEach(row => {
    if (row.length !== 3) return

    const [, rawDate, word] = row

    const strippedDate = rawDate.split(',')[1]?.trim()
    if (!strippedDate) return

    scraped.push({
      wordle_solution: new Date(strippedDate).toDateString(),
      word: word.toLowerCase(),
    })
  })

  await supabase
    .from('solutions')
    .upsert(scraped, { onConflict: 'word', ignoreDuplicates: true })
    .throwOnError()

  await supabase.from('solutions').upsert(
    WORDS.slice(0, 2443).map(word => ({ word })),
    { onConflict: 'word', ignoreDuplicates: true }
  )
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
