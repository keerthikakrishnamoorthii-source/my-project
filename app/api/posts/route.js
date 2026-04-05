import { addPost, posts, getUserFromRequest } from "../../../lib/server";

export async function GET() {
  return new Response(JSON.stringify({ posts }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  const body = await request.json();
  const author = getUserFromRequest(request);
  if (!body.title || !body.description) {
    return new Response(JSON.stringify({ message: "Title and description are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const newPost = addPost(body, author);
  return new Response(JSON.stringify({ message: "Post created.", post: newPost, posts }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
