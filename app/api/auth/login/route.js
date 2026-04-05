import { comparePassword, findUserByEmail, signToken } from "../../../../lib/server";

export async function POST(request) {
  const payload = await request.json();
  if (!payload.email || !payload.password) {
    return new Response(JSON.stringify({ message: "Email and password are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const user = findUserByEmail(payload.email);
  if (!user) {
    return new Response(JSON.stringify({ message: "No user found with that email." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const valid = await comparePassword(payload.password, user);
  if (!valid) {
    return new Response(JSON.stringify({ message: "Invalid password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = signToken(user);
  return new Response(JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
