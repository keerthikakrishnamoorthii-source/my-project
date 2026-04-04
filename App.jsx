import { useEffect, useMemo, useRef, useState } from "react";
import { categories, neighborhoods } from "./data";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const FILE_BASE = import.meta.env.VITE_FILE_BASE || "";

const emptyAuth = { name: "", email: "", password: "" };
const emptyForm = {
  title: "",
  category: "Road Safety",
  neighborhood: "Market Street",
  radius: 5,
  urgency: "medium",
  description: "",
};
const emptyEditForm = { id: null, ...emptyForm };

const urgencyLabel = {
  low: "Low Priority",
  medium: "Important",
  high: "Urgent",
};

function App() {
  const authPanelRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [token, setToken] = useState(() => localStorage.getItem("local-lens-token") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("local-lens-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("Market Street");
  const [radiusFilter, setRadiusFilter] = useState(10);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editFile, setEditFile] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [backendReady, setBackendReady] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("local-lens-token");
      return;
    }
    localStorage.setItem("local-lens-token", token);
  }, [token]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem("local-lens-user");
      return;
    }
    localStorage.setItem("local-lens-user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    fetchPosts();
    checkBackend();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminOverview();
      return;
    }
    setAdminAnalytics(null);
    setTrendingPosts([]);
    cancelEdit();
  }, [isAdmin, token]);

  const visiblePosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesNeighborhood = post.neighborhood === selectedNeighborhood;
        const matchesRadius = post.radius <= radiusFilter;
        const matchesVerification = verifiedOnly ? Boolean(post.verified) : true;
        return matchesNeighborhood && matchesRadius && matchesVerification;
      }),
    [posts, radiusFilter, selectedNeighborhood, verifiedOnly]
  );

  const stats = useMemo(
    () => ({
      total: posts.length,
      urgent: posts.filter((post) => post.urgency === "high").length,
      verified: posts.filter((post) => Boolean(post.verified)).length,
    }),
    [posts]
  );

  async function checkBackend() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      setBackendReady(response.ok);
    } catch {
      setBackendReady(false);
    }
  }

  async function fetchPosts() {
    setLoadingPosts(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/posts`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load posts.");
      }
      setBackendReady(true);
      setPosts(data.posts);
    } catch (fetchError) {
      setBackendReady(false);
      setError(fetchError.message);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function fetchAdminOverview() {
    if (!token || !isAdmin) {
      return;
    }
    setLoadingAdmin(true);
    try {
      const [analyticsResponse, trendingResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/trending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const analyticsData = await analyticsResponse.json();
      const trendingData = await trendingResponse.json();
      if (!analyticsResponse.ok) {
        throw new Error(analyticsData.message || "Unable to load admin analytics.");
      }
      if (!trendingResponse.ok) {
        throw new Error(trendingData.message || "Unable to load trending posts.");
      }
      setBackendReady(true);
      setAdminAnalytics(analyticsData);
      setTrendingPosts(trendingData.trendingPosts);
    } catch (adminError) {
      setBackendReady(false);
      setError(adminError.message);
    } finally {
      setLoadingAdmin(false);
    }
  }

  function handleAuthChange(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function handlePostChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "radius" ? Number(value) : value }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: name === "radius" ? Number(value) : value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    setMessage("");
    const endpoint = mode === "login" ? "login" : "register";
    const payload = mode === "login"
      ? { email: authForm.email, password: authForm.password }
      : authForm;
    try {
      const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }
      setBackendReady(true);
      setToken(data.token);
      setUser(data.user);
      setAuthForm(emptyAuth);
      setMessage(mode === "login" ? "Login successful." : "Registration successful.");
    } catch (authError) {
      setBackendReady(false);
      setError(authError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      setError("Please log in before creating a post.");
      return;
    }
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("category", form.category);
    payload.append("neighborhood", form.neighborhood);
    payload.append("radius", String(form.radius));
    payload.append("urgency", form.urgency);
    payload.append("description", form.description);
    if (selectedFile) {
      payload.append("image", selectedFile);
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to publish update.");
      }
      setBackendReady(true);
      setPosts((current) => [data.post, ...current]);
      setForm(emptyForm);
      setSelectedFile(null);
      setSelectedNeighborhood(data.post.neighborhood);
      setMessage("Hyperlocal update published.");
      if (isAdmin) {
        fetchAdminOverview();
      }
    } catch (submitError) {
      setBackendReady(false);
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVerification(postId) {
    if (!token || !isAdmin) {
      setError("Only the admin can verify posts.");
      return;
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update verification.");
      }
      setBackendReady(true);
      setPosts((current) => current.map((post) => (post.id === postId ? data.post : post)));
      setMessage("Verification status updated.");
      fetchAdminOverview();
    } catch (verifyError) {
      setBackendReady(false);
      setError(verifyError.message);
    }
  }

  function beginEdit(post) {
    setEditForm({
      id: post.id,
      title: post.title,
      category: post.category,
      neighborhood: post.neighborhood,
      radius: post.radius,
      urgency: post.urgency,
      description: post.description,
    });
    setEditFile(null);
  }

  function cancelEdit() {
    setEditForm(emptyEditForm);
    setEditFile(null);
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!token || !isAdmin || !editForm.id) {
      setError("Only the admin can modify posts.");
      return;
    }
    const payload = new FormData();
    payload.append("title", editForm.title);
    payload.append("category", editForm.category);
    payload.append("neighborhood", editForm.neighborhood);
    payload.append("radius", String(editForm.radius));
    payload.append("urgency", editForm.urgency);
    payload.append("description", editForm.description);
    if (editFile) {
      payload.append("image", editFile);
    }
    setSavingEdit(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/posts/${editForm.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update post.");
      }
      setBackendReady(true);
      setPosts((current) => current.map((post) => (post.id === editForm.id ? data.post : post)));
      setMessage("Post updated successfully.");
      cancelEdit();
      fetchAdminOverview();
    } catch (updateError) {
      setBackendReady(false);
      setError(updateError.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(postId) {
    if (!token || !isAdmin) {
      setError("Only the admin can delete posts.");
      return;
    }
    setDeletingPostId(postId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete post.");
      }
      setBackendReady(true);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setMessage("Post deleted successfully.");
      if (editForm.id === postId) {
        cancelEdit();
      }
      fetchAdminOverview();
    } catch (deleteError) {
      setBackendReady(false);
      setError(deleteError.message);
    } finally {
      setDeletingPostId(null);
    }
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    setAdminAnalytics(null);
    setTrendingPosts([]);
    cancelEdit();
    localStorage.removeItem("local-lens-token");
    localStorage.removeItem("local-lens-user");
    setMessage("Logged out successfully.");
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Local Lens - Hyperlocal NeighborEye</p>
          <h1>Neighborhood awareness with admin moderation and analytics.</h1>
          <p className="hero-text">
            Residents create posts. One admin account verifies, edits, deletes, monitors trends,
            and analyzes local problems.
          </p>
          <div className="hero-actions">
            <span className="chip">Single admin</span>
            <span className="chip">Many users</span>
            <span className="chip">Admin analytics</span>
          </div>
        </div>

        <section className="stats-card">
          <h2>Community Snapshot</h2>
          <div className="stats-grid">
            <article><strong>{stats.total}</strong><span>Total Posts</span></article>
            <article><strong>{stats.urgent}</strong><span>Urgent Alerts</span></article>
            <article><strong>{stats.verified}</strong><span>Verified Updates</span></article>
          </div>
        </section>
      </header>

      {(message || error) && (
        <section className={`status-banner ${error ? "error-banner" : "success-banner"}`}>
          {error || message}
        </section>
      )}

      <main className="dashboard">
