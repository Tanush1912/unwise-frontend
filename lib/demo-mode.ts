// Client-side demo mode.
//
// Serves a consistent fixture dataset through the auth-fetch chokepoint so
// the full product UI works with no backend and no auth — including inside
// cross-site iframes, where third-party cookies are blocked and session
// auth can never succeed. Activated by ?demo=true (persisted for the
// session so in-app navigation keeps working).

const DEMO_FLAG = "unwise-demo"

export const isDemoMode = (): boolean => {
  if (typeof window === "undefined") return false
  try {
    if (new URLSearchParams(window.location.search).get("demo") === "true") {
      sessionStorage.setItem(DEMO_FLAG, "1")
      return true
    }
    return sessionStorage.getItem(DEMO_FLAG) === "1"
  } catch {
    return false
  }
}

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@unwise.app",
  user_metadata: { name: "Demo User", full_name: "Demo User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-05T09:00:00Z",
}

// ---------------------------------------------------------------------------
// Fixture dataset — two groups, three friends, consistent balances.
// Positive member.balance = they owe the demo user.
// ---------------------------------------------------------------------------

const ME = { id: "demo-user", name: "Demo User", email: "demo@unwise.app" }
const MAYA = { id: "u-maya", name: "Maya Chen", email: "maya@example.com" }
const ARJUN = { id: "u-arjun", name: "Arjun Patel", email: "arjun@example.com" }
const SOFIA = { id: "u-sofia", name: "Sofia Reyes", email: "sofia@example.com" }

const now = Date.now()
const daysAgo = (d: number, h = 12) =>
  new Date(now - d * 86400000 - h * 3600000).toISOString()

let txCounter = 0
const txId = () => `demo-tx-${++txCounter}`

interface DemoTx {
  id: string
  description: string
  total_amount: number
  paid_by_user: { id: string; name: string; email: string }
  date: string
  date_iso: string
  time: string
  type: string
  user_share: number
  user_net_amount: number
  user_is_owed: boolean
  user_is_lent: boolean
  user_is_payer: boolean
  user_is_recipient: boolean
  explanation?: string
  splits: Array<{ user_id: string; user_name: string; amount: number }>
  payers: Array<{ user_id: string; user_name: string; amount_paid: number }>
  created_at: string
  group_id: string
  category?: string
  tax?: number
  service_charge?: number
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

function makeTx(opts: {
  description: string
  amount: number
  paidBy: typeof ME
  splitWith: (typeof ME)[]
  when: string
  groupId: string
  type?: string
  category?: string
  explanation?: string
}): DemoTx {
  const share = Math.round((opts.amount / opts.splitWith.length) * 100) / 100
  const isPayer = opts.paidBy.id === ME.id
  const iAmIn = opts.splitWith.some((u) => u.id === ME.id)
  const net = isPayer ? opts.amount - (iAmIn ? share : 0) : iAmIn ? -share : 0
  return {
    id: txId(),
    description: opts.description,
    total_amount: opts.amount,
    paid_by_user: { id: opts.paidBy.id, name: opts.paidBy.name, email: opts.paidBy.email },
    // ISO yyyy-MM-dd — components use this for grouping keys and parseISO.
    date: opts.when.slice(0, 10),
    date_iso: opts.when,
    time: fmtTime(opts.when),
    type: opts.type || "EXPENSE",
    user_share: iAmIn ? share : 0,
    user_net_amount: net,
    user_is_owed: net > 0,
    user_is_lent: net > 0,
    user_is_payer: isPayer,
    user_is_recipient: false,
    explanation: opts.explanation,
    splits: opts.splitWith.map((u) => ({ user_id: u.id, user_name: u.name, amount: share })),
    payers: [{ user_id: opts.paidBy.id, user_name: opts.paidBy.name, amount_paid: opts.amount }],
    created_at: opts.when,
    group_id: opts.groupId,
    category: opts.category,
  }
}

const flatTxs: DemoTx[] = [
  makeTx({
    description: "Weekly groceries — Tesco",
    amount: 86.4,
    paidBy: ME,
    splitWith: [ME, MAYA, ARJUN],
    when: daysAgo(1, 3),
    groupId: "g-flat",
    category: "Groceries",
    explanation:
      "You paid ₹86.40 and split it equally three ways. Maya and Arjun each owe you ₹28.80 for their shares.",
  }),
  makeTx({
    description: "Electricity bill — October",
    amount: 54.0,
    paidBy: ARJUN,
    splitWith: [ME, MAYA, ARJUN],
    when: daysAgo(3),
    groupId: "g-flat",
    category: "Utilities",
  }),
  makeTx({
    description: "Friday takeaway",
    amount: 45.9,
    paidBy: MAYA,
    splitWith: [ME, MAYA, ARJUN],
    when: daysAgo(5, 20),
    groupId: "g-flat",
    category: "Food & Drink",
  }),
  {
    ...makeTx({
      description: "Arjun settled up",
      amount: 20.0,
      paidBy: ARJUN,
      splitWith: [ME],
      when: daysAgo(7),
      groupId: "g-flat",
      type: "PAYMENT",
    }),
    user_is_recipient: true,
  },
]

const tripTxs: DemoTx[] = [
  makeTx({
    description: "Flights — LIS return",
    amount: 270.0,
    paidBy: SOFIA,
    splitWith: [ME, MAYA, SOFIA],
    when: daysAgo(12),
    groupId: "g-trip",
    category: "Travel",
  }),
  makeTx({
    description: "Dinner at Time Out Market",
    amount: 96.75,
    paidBy: ME,
    splitWith: [ME, MAYA, SOFIA],
    when: daysAgo(10, 21),
    groupId: "g-trip",
    category: "Food & Drink",
    explanation:
      "You covered dinner (₹96.75) for the three of you. Maya and Sofia each owe you ₹32.25.",
  }),
  makeTx({
    description: "Tram tickets + museums",
    amount: 58.5,
    paidBy: MAYA,
    splitWith: [ME, MAYA, SOFIA],
    when: daysAgo(9, 15),
    groupId: "g-trip",
    category: "Entertainment",
  }),
]

const store = {
  groups: [
    {
      id: "g-flat",
      name: "Flat 4B",
      total_balance: 14.75,
      total_spend: 206.3,
      has_debts: true,
      members: [
        { ...ME, balance: 0 },
        { ...MAYA, balance: 24.5 },
        { ...ARJUN, balance: -9.75 },
      ],
      debts: [
        { from_user: { id: MAYA.id, name: MAYA.name }, to_user: { id: ME.id, name: ME.name }, amount: 24.5 },
        { from_user: { id: ME.id, name: ME.name }, to_user: { id: ARJUN.id, name: ARJUN.name }, amount: 9.75 },
      ],
      transactions: flatTxs,
    },
    {
      id: "g-trip",
      name: "Lisbon Trip",
      total_balance: -32.1,
      total_spend: 425.25,
      has_debts: true,
      members: [
        { ...ME, balance: 0 },
        { ...SOFIA, balance: -64.35 },
        { ...MAYA, balance: 32.25 },
      ],
      debts: [
        { from_user: { id: ME.id, name: ME.name }, to_user: { id: SOFIA.id, name: SOFIA.name }, amount: 32.1 },
        { from_user: { id: MAYA.id, name: MAYA.name }, to_user: { id: SOFIA.id, name: SOFIA.name }, amount: 25.5 },
      ],
      transactions: tripTxs,
    },
  ],
}

const allTxs = () => store.groups.flatMap((g) => g.transactions)

// ---------------------------------------------------------------------------
// Request resolver
// ---------------------------------------------------------------------------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

/** Normalize any authFetch/apiRequest url to a bare path like /groups/g-flat */
function normalize(url: string): string {
  let path = url
  if (path.startsWith("http")) {
    try {
      path = new URL(path).pathname
    } catch {
      /* keep as-is */
    }
  }
  if (path.startsWith("/api/")) path = path.slice(4)
  if (!path.startsWith("/")) path = `/${path}`
  return path.split("?")[0]
}

export async function resolveDemoRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Small artificial latency so loading states render naturally.
  await new Promise((r) => setTimeout(r, 220))

  const path = normalize(url)
  const method = (options.method || "GET").toUpperCase()

  if (path === "/groups" && method === "GET") {
    return json(
      store.groups.map(({ transactions: _t, debts: _d, ...g }) => g)
    )
  }

  if (path === "/dashboard") {
    return json({
      user: { id: ME.id, name: ME.name },
      metrics: {
        total_net_balance: -17.35,
        total_you_owe: 41.85,
        total_you_are_owed: 24.5,
      },
      groups: store.groups.map((g) => ({
        id: g.id,
        name: g.name,
        my_balance_in_group: g.total_balance,
        last_activity_at: g.transactions[0]?.date_iso || daysAgo(1),
      })),
      recent_activity: allTxs()
        .sort((a, b) => (a.date_iso < b.date_iso ? 1 : -1))
        .slice(0, 5)
        .map((tx) => ({
          id: tx.id,
          description: tx.description,
          amount: tx.total_amount,
          type: tx.type === "PAYMENT" ? "PAYMENT" : "EXPENSE",
          action_text:
            tx.paid_by_user.id === ME.id
              ? `You paid ₹${tx.total_amount.toFixed(2)}`
              : `${tx.paid_by_user.name} paid ₹${tx.total_amount.toFixed(2)}`,
          created_at: tx.created_at,
          date: tx.date_iso.split("T")[0],
        })),
    })
  }

  const groupMatch = path.match(/^\/groups\/([^/]+)(?:\/(.+))?$/)
  if (groupMatch) {
    const group = store.groups.find((g) => g.id === groupMatch[1])
    if (!group) return json({ error: "Group not found" }, 404)
    const sub = groupMatch[2]

    if (!sub && method === "GET") {
      const { transactions: _t, debts: _d, ...g } = group
      return json(g)
    }
    if (sub === "balances") {
      const owedToMe = group.debts
        .filter((d) => d.to_user.id === ME.id)
        .reduce((s, d) => s + d.amount, 0)
      const iOwe = group.debts
        .filter((d) => d.from_user.id === ME.id)
        .reduce((s, d) => s + d.amount, 0)
      return json({
        debts: group.debts,
        summary: {
          total_owed_to_user: owedToMe,
          total_user_owes: iOwe,
          count_owed_to_user: group.debts.filter((d) => d.to_user.id === ME.id).length,
          count_user_owes: group.debts.filter((d) => d.from_user.id === ME.id).length,
          total_net: owedToMe - iOwe,
          state: owedToMe - iOwe > 0 ? "positive" : owedToMe - iOwe < 0 ? "negative" : "neutral",
        },
      })
    }
    if (sub === "transactions") {
      return json([...group.transactions].sort((a, b) => (a.date_iso < b.date_iso ? 1 : -1)))
    }
    // members / placeholders / settings mutations — accept quietly.
    return json({ success: true })
  }

  if (path === "/expenses/explain" && method === "POST") {
    let id = ""
    try {
      id = JSON.parse(String(options.body || "{}")).transaction_id || ""
    } catch {
      /* ignore */
    }
    const tx = allTxs().find((t) => t.id === id)
    return json({
      explanation:
        tx?.explanation ||
        (tx
          ? `${tx.paid_by_user.name === ME.name ? "You" : tx.paid_by_user.name} paid ₹${tx.total_amount.toFixed(2)} for "${tx.description}", split equally between ${tx.splits.length} people (₹${tx.splits[0]?.amount.toFixed(2)} each).`
          : "This is a demo expense — in the real product this explanation is generated by AI from the receipt and split data."),
    })
  }

  const expenseMatch = path.match(/^\/expenses\/([^/]+)$/)
  if (expenseMatch) {
    const tx = allTxs().find((t) => t.id === expenseMatch[1])
    if (method === "GET") {
      return tx ? json(tx) : json({ error: "Not found" }, 404)
    }
    if (method === "DELETE" && tx) {
      const group = store.groups.find((g) => g.id === tx.group_id)
      if (group) group.transactions = group.transactions.filter((t) => t.id !== tx.id)
      return json({ success: true })
    }
    return json({ success: true })
  }

  if (path === "/expenses" && method === "POST") {
    // Best-effort: append the new expense to its group so the demo feels live.
    try {
      const body = JSON.parse(String(options.body || "{}"))
      const group =
        store.groups.find((g) => g.id === (body.group_id || body.groupId)) || store.groups[0]
      const tx = makeTx({
        description: body.description || "New expense",
        amount: Number(body.total_amount || body.amount) || 10,
        paidBy: ME,
        splitWith: group.members.map((m) => ({ id: m.id, name: m.name, email: m.email })),
        when: new Date().toISOString(),
        groupId: group.id,
      })
      group.transactions.unshift(tx)
      return json(tx, 201)
    } catch {
      return json({ success: true }, 201)
    }
  }

  if (path === "/friends" && method === "GET") {
    return json([
      {
        id: MAYA.id,
        name: MAYA.name,
        email: MAYA.email,
        net_balance: 24.5,
        groups: store.groups.map((g) => ({ id: g.id, name: g.name, avatar_url: null })),
        group_balances: [{ group_id: "g-flat", group_name: "Flat 4B", amount: 24.5 }],
      },
      {
        id: ARJUN.id,
        name: ARJUN.name,
        email: ARJUN.email,
        net_balance: -9.75,
        groups: [{ id: "g-flat", name: "Flat 4B", avatar_url: null }],
        group_balances: [{ group_id: "g-flat", group_name: "Flat 4B", amount: -9.75 }],
      },
      {
        id: SOFIA.id,
        name: SOFIA.name,
        email: SOFIA.email,
        net_balance: -32.1,
        groups: [{ id: "g-trip", name: "Lisbon Trip", avatar_url: null }],
        group_balances: [{ group_id: "g-trip", group_name: "Lisbon Trip", amount: -32.1 }],
      },
    ])
  }

  if (path.startsWith("/friends/search")) {
    return json([])
  }

  if (path === "/user/me") {
    return json({ id: ME.id, name: ME.name, email: ME.email })
  }

  if (path === "/scan-receipt") {
    return json({
      items: [
        { name: "Flat white", price: 3.8 },
        { name: "Butter croissant", price: 2.9 },
        { name: "Fresh orange juice", price: 4.2 },
        { name: "Granola bowl", price: 7.5 },
      ],
      total: 18.4,
      subtotal: 18.4,
      tax: 0,
      cgst: 0,
      sgst: 0,
      service_charge: 0,
      prices_include_tax: true,
    })
  }

  // Any other mutation or unknown read: succeed quietly so the demo never
  // dead-ends. Real error handling is the production backend's job.
  return json(method === "GET" ? [] : { success: true })
}
