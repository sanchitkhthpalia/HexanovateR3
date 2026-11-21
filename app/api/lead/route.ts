import { NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/validation/lead";

// POST /api/lead — STUB. Validates with the same schema as the browser and returns success.
// Still to come (docs/plan.md steps 8–9): origin check, rate limit, minimum fill time,
// then CRM + Google Sheet + email fan-out with partial-failure handling.
// Only POST is exported, so Next.js answers other methods with 405.

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    // First message per field, in the same shape the form uses — no stack traces or internals.
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      fields[path] ??= issue.message;
    }
    return NextResponse.json({ ok: false, error: "validation", fields }, { status: 400 });
  }

  // Honeypot filled: almost certainly a bot. Answer like a success so it learns nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
