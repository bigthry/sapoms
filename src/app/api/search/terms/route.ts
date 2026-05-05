// app/api/terms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveAgreement, getAllAgreements } from "@/Store/termsStore";
import { AgreementRecord } from "../../../types/route";

// POST /api/terms — called when user accepts T&C
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, email } = body;

    if (!userId || !userName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userName, email" },
        { status: 400 }
      );
    }

    const record: AgreementRecord = {
      userId,
      userName,
      email,
      acceptedAt: new Date().toISOString(),
      status: "agreed",
    };

    saveAgreement(record);

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/terms — called by admin page to list all acceptances
export async function GET() {
  const records = getAllAgreements();
  return NextResponse.json({ records }, { status: 200 });
}