"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "urgent";
  targetRoles: string[];
  isActive: boolean;
  expiresAt?: string;
  createdBy: { name: string };
  createdAt: string;
  views: number;
  acknowledgments: number;
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function AnnouncementsPage() {
  const { data: announcements, mutate } = useSWR<Announcement[]>("/api/announcements", fetcher);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info" as const,
    targetRoles: [] as string[],
    requiresAcknowledgment: false,
    expiresAt: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await api.post("/api/announcements", formData);
      mutate();
      setIsCreateOpen(false);
      setFormData({
        title: "",
        content: "",
        type: "info",
        targetRoles: [],
        requiresAcknowledgment: false,
        expiresAt: "",
      });
    } catch (error) {
      console.error("Failed to create announcement:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mutate]);

  const handleToggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/announcements/${id}`, { isActive: !isActive });
      mutate();
    } catch (error) {
      console.error("Failed to toggle announcement:", error);
    }
  }, [mutate]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/announcements/${id}`);
      mutate();
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  }, [mutate]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "success": return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "urgent": return <Bell className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      info: "secondary",
      warning: "outline",
      success: "default",
      urgent: "destructive",
    };
    return <Badge variant={variants[type] || "outline"}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Communicate with your team through targeted announcements
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Send a message to your team members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Announcement title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Write your announcement..."
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expires At</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Acknowledgment</Label>
                  <p className="text-sm text-muted-foreground">
                    Users must confirm they&apos;ve read this
                  </p>
                </div>
                <Switch
                  checked={formData.requiresAcknowledgment}
                  onCheckedChange={(v) => setFormData({ ...formData, requiresAcknowledgment: v })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {announcements?.map((announcement) => (
          <Card key={announcement._id} className={!announcement.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getTypeIcon(announcement.type)}
                  <div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {getTypeBadge(announcement.type)}
                      <span>by {announcement.createdBy?.name || "System"}</span>
                      <span>-</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(announcement._id, announcement.isActive)}
                  >
                    {announcement.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(announcement._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {announcement.content}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {announcement.views} views
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {announcement.acknowledgments} acknowledged
                </span>
                {announcement.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expires {new Date(announcement.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!announcements || announcements.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Create your first announcement to communicate with your team
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
