"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, neighborhoods } from "../lib/constants";

const defaultPost = {
  title: "",
  category: "Road Safety",
  neighborhood: "Market Street",
  radius: 5,
  urgency: "medium",
  description: "",
};

const emptyAuth = { name: "", email: "", password: "" };

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState(defaultPost);
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("local-lens-token");
    const storedUser = localStorage.getItem("local-lens-user");
    if (stored) {
      setToken(stored);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    checkHealth();
    fetchPosts();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("local-lens-token", token);
    } else {
      localStorage.removeItem("local-lens-token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("local-lens-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("local-lens-user");
    }
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      urgent: posts.filter((post) => post.urgency === "high").length,
      verified: posts.filter((post) => post.verified).length,
    };
  }, [posts]);

  async function apiRequest(path, options) {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(path, { headers, ...options });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }
    return data;
  }

  async function checkHealth() {
    try {
      const response = await fetch("/api/health");
      setBackendHealthy(response.ok);
    } catch {
      setBackendHealthy(false);
    }
  }

  async function fetchPosts() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/posts");
      setPosts(data.posts);
      setBackendHealthy(true);
    } catch (err) {
      setBackendHealthy(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email: authForm.email, password: authForm.password } : authForm;
      const data = await apiRequest(path, { method: "POST", body: JSON.stringify(payload) });
      setToken(data.token);
      setUser(data.user);
      setMessage(`${mode === "login" ? "Logged in" : "Registered"} successfully.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify(postForm),
      });
      setPosts(data.posts);
      setMessage("Your update was posted successfully.");
      setPostForm(defaultPost);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAuthChange(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function handlePostChange(event) {
    const { name, value } = event.target;
    setPostForm((current) => ({
      ...current,
      [name]: name === "radius" ? Number(value) : value,
    }));
  }

  function signOut() {
    setToken("");
    setUser(null);
    setMessage("Signed out successfully.");
  }

  return (
    <main className="container">
      <header className="site-header">
        <div>
          <h1 className="site-title">Local Lens</h1>
          <p className="hero-text">
            A hyperlocal neighbor alert platform built with Next.js for both frontend and backend.
          </p>
        </div>
        <div className="status-pill">
          {backendHealthy ? "Backend available" : "Backend offline"}
        </div>
      </header>

      <div className="grid grid-2">
        <section className="panel">
          <h2>Latest updates</h2>
          <p className="hero-text">
            Browse nearby reports, verify important alerts, and share what matters in your neighborhood.
          </p>

          {error && <div className="alert">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <div className="grid">
            <div className="post-card">
              <div className="post-meta">
                <span className="badge">Total reports: {stats.total}</span>
                <span className="badge">Urgent: {stats.urgent}</span>
                <span className="badge">Verified: {stats.verified}</span>
              </div>
            </div>
            {loading ? (
              <div className="post-card">Loading posts...</div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="post-card">
                  <div className="post-meta">
                    <span className="badge">{post.category}</span>
                    <span>{post.neighborhood}</span>
                    <span>{post.time || "just now"}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <div className="post-meta">
                    <span>{post.urgency === "high" ? "High priority" : "Normal priority"}</span>
                    <span>{post.verified ? "Verified" : "Unverified"}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>{user ? `Welcome back, ${user.name}` : mode === "login" ? "Login to Local Lens" : "Register a new account"}</h2>
          <form className="form-grid" onSubmit={handleAuthSubmit}>
            {mode === "register" && (
              <label>
                Name
                <input name="name" type="text" value={authForm.name} onChange={handleAuthChange} required />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" value={authForm.email} onChange={handleAuthChange} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={authForm.password} onChange={handleAuthChange} required />
            </label>
            <div className="button-group">
              <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
              <button type="button" className="secondary" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Use existing account"}</button>
            </div>
          </form>

          {user && (
            <div style={{ marginTop: "1rem" }}>
              <button className="secondary" onClick={signOut}>Sign out</button>
            </div>
          )}

          <hr style={{ margin: "2rem 0", borderColor: "#e2e8f0" }} />

          <h2>Post a community alert</h2>
          <form className="form-grid" onSubmit={handleCreatePost}>
            <label>
              Title
              <input name="title" value={postForm.title} onChange={handlePostChange} required />
            </label>
            <label>
              Category
              <select name="category" value={postForm.category} onChange={handlePostChange}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Neighborhood
              <select name="neighborhood" value={postForm.neighborhood} onChange={handlePostChange}>
                {neighborhoods.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Radius (km)
              <input name="radius" type="number" min="1" max="20" value={postForm.radius} onChange={handlePostChange} required />
            </label>
            <label>
              Urgency
              <select name="urgency" value={postForm.urgency} onChange={handlePostChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Description
              <textarea name="description" value={postForm.description} onChange={handlePostChange} required />
            </label>
            <button type="submit">Submit update</button>
          </form>
        </section>
      </div>

      {user?.role === "admin" && (
        <section className="panel" style={{ marginTop: "1.5rem" }}>
          <h2>Admin dashboard</h2>
          <p>Admins can use backend API routes to manage platform data and view trending alerts.</p>
        </section>
      )}
    </main>
  );
}
