
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        router.replace("/login");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const formatDate = (date: string) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="profile-page">
      <div className="profile-container">
        <button
          type="button"
          className="profile-back-button"
          onClick={() => router.push("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <div className="profile-heading">
          <div className="profile-avatar">
            {user.full_name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <h1>My Profile</h1>
            <p>View your account information</p>
          </div>
        </div>

        <section className="profile-card">
          <h2>Personal Information</h2>

          <div className="profile-info-row">
            <span>Full Name</span>
            <strong>{user.full_name || "Not available"}</strong>
          </div>

          <div className="profile-info-row">
            <span>Email Address</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-info-row">
            <span>Email Verification</span>
            <strong
              className={
                user.is_verified
                  ? "profile-verified"
                  : "profile-unverified"
              }
            >
              {user.is_verified ? "Verified" : "Not verified"}
            </strong>
          </div>

          <div className="profile-info-row">
            <span>Account Created</span>
            <strong>{formatDate(user.created_at)}</strong>
          </div>

          <div className="profile-info-row">
            <span>Account ID</span>
            <strong>{user.id}</strong>
          </div>
        </section>
      </div>
    </main>
  );
}
