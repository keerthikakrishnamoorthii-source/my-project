import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { categories, neighborhoods, posts, users } from "./data";

export { posts };

const JWT_SECRET = process.env.JWT_SECRET || "local-lens-secret";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

export function verifyToken(token) {
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function comparePassword(password, user) {
  return bcrypt.compare(password, user.passwordHash);
}

export function createUser(payload) {
  const normalizedEmail = payload.email.toLowerCase();
  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    return null;
  }
  const newUser = {
    id: users.length + 1,
    name: payload.name || "Local Lens User",
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(payload.password, 10),
    role: "user",
  };
  users.push(newUser);
  return newUser;
}

export function addPost(payload, author) {
  const newPost = {
    id: posts.length + 1,
    title: payload.title,
    category: payload.category,
    neighborhood: payload.neighborhood,
    radius: Number(payload.radius) || 5,
    urgency: payload.urgency || "medium",
    verified: author?.role === "admin",
    reporter: author?.name || "Anonymous reporter",
    time: "just now",
    description: payload.description,
  };
  posts.unshift(newPost);
  return newPost;
}

export function getAnalytics() {
  return {
    totalPosts: posts.length,
    verifiedPosts: posts.filter((post) => post.verified).length,
    urgentPosts: posts.filter((post) => post.urgency === "high").length,
    neighborhoods: Object.fromEntries(
      categories.map((category) => [category, posts.filter((post) => post.category === category).length])
    ),
  };
}

export function getTrendingPosts() {
  return posts.slice(0, 3);
}

export function getCategories() {
  return categories;
}

export function getNeighborhoods() {
  return neighborhoods;
}

export function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }
  return findUserByEmail(payload.email);
}
