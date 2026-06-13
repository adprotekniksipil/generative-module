// Firebase Auth logout dilakukan di client-side (firebase/auth signOut)
// Route ini hanya untuk membersihkan cookie session jika ada

export async function POST() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "__session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}
