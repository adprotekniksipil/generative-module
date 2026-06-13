import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    // Check Firestore connectivity with a lightweight read
    await adminDb.collection("_health").limit(1).get();

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    return Response.json(
      { status: "error", message: "Firestore unreachable" },
      { status: 503 }
    );
  }
}
