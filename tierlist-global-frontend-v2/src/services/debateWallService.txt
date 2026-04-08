import { apiRequest, shouldUseMocks } from "@/services/httpClient";
import { mockWallPosts } from "@/services/mockData";
import type { DebateWallPost } from "@/types/contracts";

interface CreateWallPostInput {
  author: string;
  userId: string;
  text: string;
  tags: string[];
}

function normalizePost(post: DebateWallPost): DebateWallPost {
  return {
    ...post,
    text: post.text.trim(),
    tags: post.tags.map((tag) => tag.trim()).filter(Boolean),
  };
}

export async function getDebateWallPosts(): Promise<DebateWallPost[]> {
  if (shouldUseMocks) {
    return mockWallPosts.map(normalizePost);
  }
  const payload = await apiRequest<DebateWallPost[]>("/debate-wall");
  return payload.map(normalizePost);
}

export async function createDebateWallPost(input: CreateWallPostInput): Promise<DebateWallPost> {
  if (shouldUseMocks) {
    const next: DebateWallPost = {
      id: `wp-${Math.random().toString(36).slice(2, 7)}`,
      x: 22,
      y: 24,
      color: "violet",
      updatedAt: new Date().toISOString(),
      ...input,
    };
    mockWallPosts.push(next);
    return normalizePost(next);
  }

  const payload = await apiRequest<DebateWallPost>("/debate-wall", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizePost(payload);
}

export async function moveDebateWallPost(id: string, x: number, y: number): Promise<DebateWallPost> {
  if (shouldUseMocks) {
    const target = mockWallPosts.find((post) => post.id === id);
    if (!target) {
      throw new Error("No se encontro el mensaje");
    }
    target.x = x;
    target.y = y;
    target.updatedAt = new Date().toISOString();
    return normalizePost(target);
  }

  const payload = await apiRequest<DebateWallPost>(`/debate-wall/${id}/position`, {
    method: "PUT",
    body: JSON.stringify({ x, y }),
  });
  return normalizePost(payload);
}

export async function updateDebateWallPost(id: string, text: string): Promise<DebateWallPost> {
  if (shouldUseMocks) {
    const target = mockWallPosts.find((post) => post.id === id);
    if (!target) {
      throw new Error("No se encontro el mensaje");
    }
    target.text = text;
    target.updatedAt = new Date().toISOString();
    return normalizePost(target);
  }

  const payload = await apiRequest<DebateWallPost>(`/debate-wall/${id}`, {
    method: "PUT",
    body: JSON.stringify({ text }),
  });
  return normalizePost(payload);
}

export async function deleteDebateWallPost(id: string): Promise<void> {
  if (shouldUseMocks) {
    const index = mockWallPosts.findIndex((post) => post.id === id);
    if (index >= 0) {
      mockWallPosts.splice(index, 1);
    }
    return;
  }
  await apiRequest(`/debate-wall/${id}`, { method: "DELETE" });
}