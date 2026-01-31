"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  Link, 
  Search, 
  Trash2, 
  Eye,
  Database,
  BookOpen,
  Globe
} from "lucide-react";

interface KnowledgeDocument {
  _id: string;
  title: string;
  type: "pdf" | "url" | "text" | "menu";
  source: string;
  status: "pending" | "processing" | "completed" | "failed";
  chunks: number;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function KnowledgePage() {
  const { data: documents, mutate } = useSWR<KnowledgeDocument[]>("/api/knowledge", fetcher);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState<"url" | "text" | "file">("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (addType === "url") {
        await api.post("/api/ingest/url", { url: urlInput, title: titleInput || undefined });
      } else if (addType === "text") {
        await api.post("/api/ingest/text", { content: textInput, title: titleInput });
      }
      mutate();
      setIsAddOpen(false);
      setUrlInput("");
      setTextInput("");
      setTitleInput("");
    } catch (error) {
      console.error("Failed to add document:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [addType, urlInput, textInput, titleInput, mutate]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/knowledge/${id}`);
      mutate();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }, [mutate]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await api.post("/api/search", { query: searchQuery });
      console.log("Search results:", response.data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      pending: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="h-4 w-4" />;
      case "url": return <Globe className="h-4 w-4" />;
      case "text": return <BookOpen className="h-4 w-4" />;
      case "menu": return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage documents and data sources for AI agents
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Knowledge Source</DialogTitle>
              <DialogDescription>
                Add a URL, upload a file, or paste text content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={addType} onValueChange={(v) => setAddType(v as typeof addType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Web URL
                      </div>
                    </SelectItem>
                    <SelectItem value="file">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF File
                      </div>
                    </SelectItem>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Text Content
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  placeholder="Document title"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                />
              </div>

              {addType === "url" && (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://example.com/menu"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                </div>
              )}

              {addType === "file" && (
                <div className="space-y-2">
                  <Label>Upload PDF</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {addType === "text" && (
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Paste your text content here..."
                    rows={6}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Source"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semantic Search</CardTitle>
          <CardDescription>
            Search across all knowledge sources using natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="What are the most popular appetizers?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documents?.length || 0} documents in the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents?.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(doc.type)}
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {doc.source}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.chunks}</TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!documents || documents.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Database className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No documents yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add your first knowledge source to get started
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
