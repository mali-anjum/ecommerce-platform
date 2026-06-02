"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/hooks/use-toast";
import { formatDateTime } from "@/components/common/utils/formatDates";
import {
  useKnowledgeBaseStore,
  type KnowledgeBaseRecord,
} from "@/components/super-admin/ai/state/useKnowledgeBaseStore";

type KnowledgeBasePanelProps = {
  embedded?: boolean;
};

export function KnowledgeBasePanel({ embedded = false }: KnowledgeBasePanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    documents,
    isLoading,
    error,
    fetchDocuments,
    uploadDocument,
    createManual,
    updateDocument,
    deleteDocument,
  } = useKnowledgeBaseStore();

  const [uploadTitle, setUploadTitle] = useState("");
  const [manualDraft, setManualDraft] = useState({
    title: "",
    content: "",
  });
  const [editing, setEditing] = useState<KnowledgeBaseRecord | null>(null);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const handleUpload = async (file: File) => {
    const ok = await uploadDocument(file, uploadTitle);
    if (ok) {
      toast({
        title: "Uploaded",
        description: "Document text extracted and indexed for the AI assistant.",
      });
      setUploadTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateManual = async () => {
    if (!manualDraft.title.trim() || !manualDraft.content.trim()) {
      toast({
        title: "Validation",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    const ok = await createManual({
      title: manualDraft.title.trim(),
      content: manualDraft.content.trim(),
    });

    if (ok) {
      toast({ title: "Saved", description: "Manual knowledge entry created." });
      setManualDraft({ title: "", content: "" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const ok = await updateDocument(editing.id, {
      title: editing.title,
      content: editing.content,
      isActive: editing.isActive,
    });

    if (ok) {
      toast({ title: "Updated", description: "Knowledge entry saved." });
      setEditing(null);
    }
  };

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
      {!embedded && (
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Knowledge base documents</h1>
            <p className="text-muted-foreground">
              Upload PDFs or text files — extracted content trains the AI assistant.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="upload-title">Title (optional)</Label>
            <Input
              id="upload-title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Defaults to filename"
            />
          </div>
          <div>
            <Label htmlFor="document-file">PDF or .txt file</Label>
            <Input
              id="document-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Max 10 MB. Text is extracted and stored for AI context; original file
            is saved to Cloudinary or local storage when available.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add manual entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="manual-title">Title</Label>
            <Input
              id="manual-title"
              value={manualDraft.title}
              onChange={(e) =>
                setManualDraft({ ...manualDraft, title: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="manual-content">Content</Label>
            <Textarea
              id="manual-content"
              rows={5}
              value={manualDraft.content}
              onChange={(e) =>
                setManualDraft({ ...manualDraft, content: e.target.value })
              }
            />
          </div>
          <Button onClick={() => void handleCreateManual()} disabled={isLoading}>
            <Upload className="mr-2 h-4 w-4" />
            Save manual entry
          </Button>
        </CardContent>
      </Card>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <Textarea
              rows={8}
              value={editing.content}
              onChange={(e) =>
                setEditing({ ...editing, content: e.target.value })
              }
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={editing.isActive}
                onCheckedChange={(checked) =>
                  setEditing({ ...editing, isActive: checked === true })
                }
              />
              <Label htmlFor="edit-active">Active in AI context</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void handleSaveEdit()} disabled={isLoading}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Indexed documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No documents indexed yet.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.title}
                      {doc.fileName && (
                        <p className="text-xs text-muted-foreground">
                          {doc.fileName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.sourceType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {doc.content}
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.isActive ? "default" : "secondary"}>
                        {doc.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(doc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void deleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {documents.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated entries shown with created date:{" "}
              {formatDateTime(documents[0].updatedAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
