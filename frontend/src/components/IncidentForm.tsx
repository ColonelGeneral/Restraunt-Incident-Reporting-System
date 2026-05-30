import React, { useState } from 'react';
import { apiPath } from '../utils/api';

export default function IncidentForm({ token, onCreated }: { token: string | null; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [storeLocation, setStoreLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(apiPath('/api/uploads/image'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.message ?? 'Failed to upload image');
    }

    const payload = await res.json();
    return payload.imageUrl as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !category.trim() || !storeLocation.trim()) {
      setError('Please fill required fields');
      return;
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    if (imageUrl.trim() && !/^https?:\/\//i.test(imageUrl.trim())) {
      setError('Image URL must start with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = imageUrl.trim();

      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadImage(imageFile);
      }

      const res = await fetch(apiPath('/api/incidents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          severity,
          storeLocation: storeLocation.trim(),
          imageUrl: finalImageUrl,
          generatedSummary
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? 'Failed to create');
      }
      setTitle('');
      setDescription('');
      setCategory('');
      setSeverity('Low');
      setStoreLocation('');
      setImageUrl('');
      setImageFile(null);
      setGeneratedSummary(false);
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? 'Create failed');
    } finally {
      setUploadingImage(false);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <div style={{ marginBottom: 8 }}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ padding: 8 }}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Store Location</label>
        <input value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Image upload (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          style={{ width: '100%', padding: 8 }}
        />
        {imageFile && <div style={{ fontSize: 12, marginTop: 4 }}>Selected: {imageFile.name}</div>}
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Or paste image URL</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={generatedSummary} onChange={(e) => setGeneratedSummary(e.target.checked)} />
          Generate AI summary from description
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={loading || uploadingImage}>
          {uploadingImage ? 'Uploading…' : loading ? 'Creating…' : 'Create Incident'}
        </button>
      </div>
    </form>
  );
}
