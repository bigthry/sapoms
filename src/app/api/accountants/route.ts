import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function GET() {
  try {
    const db = await getDb();
    const accountants = await db
      .collection("accountants")
      .find({}, { projection: { password: 0 } })
      .toArray();
    return NextResponse.json({ success: true, data: accountants });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password || !phone) {
      return NextResponse.json({ success: false, message: "All fields required" }, { status: 400 });
    }
    const db = await getDb();
    const existing = await db.collection("accountants").findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 409 });
    }
    const result = await db.collection("accountants").insertOne({
      name,
      email,
      password: hashPassword(password),
      phone,
      role: "accountant",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, name, email, phone, role: "accountant" },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
