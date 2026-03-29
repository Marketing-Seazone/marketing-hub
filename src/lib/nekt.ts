export interface NektResult {
  columns: string[]
  rows: Record<string, string | number | null>[]
}

export async function queryNekt(sql: string): Promise<NektResult> {
  const apiKey = process.env.NEKT_API_KEY
  if (!apiKey) throw new Error("NEKT_API_KEY não configurada")

  const queryRes = await fetch("https://api.nekt.ai/api/v1/sql-query/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ sql, mode: "csv" }),
  })

  if (!queryRes.ok) {
    const body = await queryRes.text()
    throw new Error(`Nekt API error (${queryRes.status}): ${body}`)
  }

  const queryData = await queryRes.json()

  let urls: string[] = []
  if (Array.isArray(queryData.presigned_urls) && queryData.presigned_urls.length > 0) {
    urls = queryData.presigned_urls
  } else if (queryData.presigned_url) {
    urls = [queryData.presigned_url]
  } else if (queryData.url) {
    urls = [queryData.url]
  }

  if (urls.length === 0) {
    throw new Error(`Nekt API: resposta sem presigned_url — ${JSON.stringify(queryData)}`)
  }

  const csvChunks = await Promise.all(urls.map(async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Falha ao baixar CSV: ${res.status}`)
    return res.text()
  }))

  const combined = csvChunks[0] + (csvChunks.length > 1
    ? "\n" + csvChunks.slice(1).map(c => c.trim().split("\n").slice(1).join("\n")).join("\n")
    : "")

  return parseCSV(combined)
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim()); current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(csv: string): NektResult {
  const lines = csv.trim().split("\n")
  if (lines.length < 1) return { columns: [], rows: [] }
  const columns = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCSVLine(line)
    const row: Record<string, string | number | null> = {}
    for (let i = 0; i < columns.length; i++) {
      const val = (values[i] ?? "").trim()
      row[columns[i]] = val === "" || val === "null" || val === "NULL" ? null : val
    }
    return row
  })
  return { columns, rows }
}
