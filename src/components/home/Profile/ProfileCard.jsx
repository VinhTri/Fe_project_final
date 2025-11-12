import { useRef, useState, useEffect } from "react";
import { useToast } from "../../../contexts/ToastContext";
import "../../../styles/home/Profile.css";

export default function ProfileCard({ user, onChangeAvatar }) {
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const u = user || {
    name: "Trần Vinh Trí",
    email: "admin@example.com",
    avatar: "https://i.pravatar.cc/150?img=13",
  };

  // ✅ Reset preview khi user.avatar thay đổi (sau khi upload thành công)
  useEffect(() => {
    setPreview(null);
    setUploading(false);
  }, [user?.avatar]);

  const avatarSrc = preview || u.avatar;

  // Xử lý khi chọn ảnh
  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast("Vui lòng chọn file ảnh (JPG, PNG, GIF, v.v.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước ảnh tối đa 5MB");
      return;
    }

    // Show preview immediately
    const url = URL.createObjectURL(file);
    setPreview(url);
    setUploading(true);

    // ✅ Call parent callback to upload
    if (onChangeAvatar) {
      await onChangeAvatar(file);
    }
    
    // Preview sẽ được reset bởi useEffect khi user.avatar update
  };

  return (
    <div className="profile__card-minimal">
      <div
        className="profile__avatar editable"
        onClick={() => !uploading && fileRef.current?.click()}
        title={uploading ? "Đang upload..." : "Nhấn để đổi ảnh đại diện"}
        style={{ opacity: uploading ? 0.6 : 1, cursor: uploading ? "wait" : "pointer" }}
      >
        <img src={avatarSrc} alt="Ảnh đại diện" />
        <div className="profile__avatar-overlay">
          {uploading ? (
            <div className="spinner-border spinner-border-sm text-light" role="status">
              <span className="visually-hidden">Đang upload...</span>
            </div>
          ) : (
            <i className="bi bi-camera-fill"></i>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleSelect}
          disabled={uploading}
        />
      </div>

      <h5 className="profile__name">{u.name}</h5>
      <p className="profile__email">{u.email}</p>
      {uploading && (
        <small className="text-muted">
          <i className="bi bi-cloud-upload me-1"></i>
          Đang tải ảnh lên...
        </small>
      )}
    </div>
  );
}