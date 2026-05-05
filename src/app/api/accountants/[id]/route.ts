import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const accountant = await db
      .collection("accountants")
      .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
    if (!accountant) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: accountant });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, string> = {};
    if (body.name)     update.name     = body.name;
    if (body.email)    update.email    = body.email;
    if (body.phone)    update.phone    = body.phone;
    if (body.password) update.password = hashPassword(body.password);
    const db = await getDb();
    await db.collection("accountants").updateOne({ _id: new ObjectId(id) }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("accountants").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
