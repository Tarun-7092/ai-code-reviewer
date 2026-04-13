import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { Card, CardHeader, Input, Button, Alert } from "../components/ui";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || "", avatar: user?.avatar || "" });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await authApi.updateProfile({ name: profile.name });
      updateUser({ name: res.data.user.name });
      setProfileMsg({ type: "success", text: "Profile updated!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.error || "Update failed." });
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return setPwMsg({ type: "error", text: "Min 6 characters." });
    setPwMsg(null);
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm);
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    } finally {
      setPwLoading(false);
    }
  };

  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" }) : "";

  return (
    <div className={styles.page}>
      <div className={"fade-in " + styles.header}>
        <h1 className={styles.heading}>Profile</h1>
        <p className={styles.sub}>Manage your account settings</p>
      </div>

      <div className={styles.layout}>
        {/* User card */}
        <div className="fade-in-1">
          <Card className={styles.userCard}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
            <div className={styles.userStats}>
              <div className={styles.userStat}>
                <span className={styles.statNum}>{user?.reviewCount ?? 0}</span>
                <span className={styles.statLbl}>Reviews</span>
              </div>
              <div className={styles.userStatDivider} />
              <div className={styles.userStat}>
                <span className={styles.statNum}>{user?.role}</span>
                <span className={styles.statLbl}>Role</span>
              </div>
            </div>
            <div className={styles.memberSince}>Member since {memberSince}</div>
          </Card>
        </div>

        <div className={styles.forms}>
          {/* Update profile */}
          <div className="fade-in-2">
            <Card>
              <CardHeader title="Update Profile" />
              <form onSubmit={saveProfile} className={styles.form}>
                {profileMsg && <Alert type={profileMsg.type}>{profileMsg.text}</Alert>}
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <Input label="Email" value={user?.email} disabled style={{ opacity: 0.5 }} />
                <div className={styles.formNote}>Email cannot be changed.</div>
                <Button type="submit" loading={profileLoading}>Save Changes</Button>
              </form>
            </Card>
          </div>

          {/* Change password */}
          <div className="fade-in-3">
            <Card>
              <CardHeader title="Change Password" />
              <form onSubmit={changePassword} className={styles.form}>
                {pwMsg && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
                <Input
                  label="Current Password"
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="min. 6 characters"
                  required
                />
                <Button type="submit" loading={pwLoading}>Change Password</Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
