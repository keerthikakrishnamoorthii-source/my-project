import { getTrendingPosts, getUserFromRequest } from "../../../../lib/server";

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ message: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ trendingPosts: getTrendingPosts() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
