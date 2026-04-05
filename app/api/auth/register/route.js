import { createUser, signToken } from "../../../../lib/server";

export async function POST(request) {
  const payload = await request.json();
  if (!payload.email || !payload.password || !payload.name) {
    return new Response(JSON.stringify({ message: "Name, email, and password are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const user = createUser(payload);
  if (!user) {
    return new Response(JSON.stringify({ message: "A user with that email already exists." }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = signToken(user);
  return new Response(JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
