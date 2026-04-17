"use client";

import { useState, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

import { useRBAC } from "@/contexts/rbac-context";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { mockForbiddenWords, type ForbiddenWord } from "@/lib/mock-data";

export default function ForbiddenWordsPage() {
  const { can } = useRBAC();

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [words, setWords] = useState<ForbiddenWord[]>(mockForbiddenWords);
  const [search, setSearch] = useState("");

  // Add/Edit dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ForbiddenWord | null>(null);
  const [formWord, setFormWord] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ForbiddenWord | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // CSV upload
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ word: string; reason: string }[]>([]);
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canWrite = can("cms.content.create");

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      w =>
        w.word.toLowerCase().includes(q) ||
        w.reason.toLowerCase().includes(q) ||
        w.registeredBy.toLowerCase().includes(q)
    );
  }, [words, search]);

  // -------------------------------------------------------------------------
  // Handlers — Add / Edit
  // -------------------------------------------------------------------------
  const openAdd = () => {
    setEditTarget(null);
    setFormWord("");
    setFormReason("");
    setFormError("");
    setIsFormOpen(true);
  };

  const openEdit = (fw: ForbiddenWord) => {
    setEditTarget(fw);
    setFormWord(fw.word);
    setFormReason(fw.reason);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    const trimmed = formWord.trim();
    if (!trimmed) { setFormError("금칙어를 입력해주세요."); return; }
    if (!formReason.trim()) { setFormError("등록 사유를 입력해주세요."); return; }

    // Duplicate check (exclude self on edit)
    const isDup = words.some(
      w => w.word === trimmed && w.id !== editTarget?.id
    );
    if (isDup) { setFormError(`"${trimmed}"은(는) 이미 등록된 금칙어입니다.`); return; }

    const now = new Date().toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(/\. /g, "-").replace(".", "");

    if (editTarget) {
      setWords(prev =>
        prev.map(w =>
          w.id === editTarget.id
            ? { ...w, word: trimmed, reason: formReason.trim(), modifiedAt: now }
            : w
        )
      );
    } else {
      const newId = `FW-${String(words.length + 1).padStart(3, "0")}`;
      setWords(prev => [
        ...prev,
        { id: newId, word: trimmed, reason: formReason.trim(), registeredBy: "현재 사용자", registeredAt: now },
      ]);
    }
    setIsFormOpen(false);
  };

  // -------------------------------------------------------------------------
  // Handlers — Delete
  // -------------------------------------------------------------------------
  const openDelete = (fw: ForbiddenWord) => {
    setDeleteTarget(fw);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setWords(prev => prev.filter(w => w.id !== deleteTarget.id));
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  // -------------------------------------------------------------------------
  // Handlers — CSV Upload
  // -------------------------------------------------------------------------
  const parseCsv = (raw: string) => {
    setCsvError("");
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const parsed: { word: string; reason: string }[] = [];

    for (const line of lines) {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const word = cols[0];
      const reason = cols[1] ?? "일괄 등록";
      if (!word) continue;
      parsed.push({ word, reason });
    }

    if (parsed.length === 0) {
      setCsvError("유효한 데이터가 없습니다. 형식: 금칙어,사유");
      setCsvPreview([]);
      return;
    }
    setCsvPreview(parsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCsv(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleCsvTextChange = (val: string) => {
    setCsvText(val);
    parseCsv(val);
  };

  const handleCsvImport = () => {
    if (csvPreview.length === 0) return;
    const now = new Date().toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(/\. /g, "-").replace(".", "");

    const existing = new Set(words.map(w => w.word));
    const newEntries: ForbiddenWord[] = csvPreview
      .filter(p => !existing.has(p.word))
      .map((p, idx) => ({
        id: `FW-${String(words.length + idx + 1).padStart(3, "0")}`,
        word: p.word,
        reason: p.reason,
        registeredBy: "현재 사용자",
        registeredAt: now,
      }));

    setWords(prev => [...prev, ...newEntries]);
    setIsCsvOpen(false);
    setCsvText("");
    setCsvPreview([]);
    setCsvError("");
  };

  const openCsvDialog = () => {
    setCsvText("");
    setCsvPreview([]);
    setCsvError("");
    setIsCsvOpen(true);
  };

  // -------------------------------------------------------------------------
  // Access guard
  // -------------------------------------------------------------------------
  if (!can("cms.content.read")) return <AccessDenied />;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-auto">

        <PageHeader
          title="금칙어 관리"
          description="콘텐츠 작성 시 사용이 제한되는 단어를 등록·관리합니다"
          breadcrumbs={[
            { label: "CMS", href: "/cms" },
            { label: "금칙어 관리" },
          ]}
        />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">전체 금칙어</p>
                  <p className="text-2xl font-semibold">{words.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">검색 결과</p>
                  <p className="text-2xl font-semibold">{filtered.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="금칙어, 사유, 등록자 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {canWrite && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openCsvDialog}>
                <Upload className="h-4 w-4 mr-2" />
                CSV 일괄 등록
              </Button>
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                금칙어 등록
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">번호</TableHead>
                <TableHead className="w-[140px]">금칙어</TableHead>
                <TableHead>등록 사유</TableHead>
                <TableHead className="w-[160px]">등록자</TableHead>
                <TableHead className="w-[160px]">등록일시</TableHead>
                <TableHead className="w-[160px]">수정일시</TableHead>
                {canWrite && <TableHead className="w-[100px] text-center">관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canWrite ? 7 : 6} className="py-16 text-center text-muted-foreground">
                    {search ? `"${search}"에 대한 검색 결과가 없습니다` : "등록된 금칙어가 없습니다"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((fw, idx) => (
                  <TableRow key={fw.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-sm px-2 py-0.5">
                        {fw.word}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fw.reason}</TableCell>
                    <TableCell className="text-sm">{fw.registeredBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fw.registeredAt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fw.modifiedAt ?? "—"}</TableCell>
                    {canWrite && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(fw)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => openDelete(fw)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Result count */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            총 {filtered.length}개 금칙어
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Dialog                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "금칙어 수정" : "금칙어 등록"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "금칙어 단어 또는 사유를 수정합니다."
                : "콘텐츠 작성 시 사용이 제한될 단어를 등록합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="fw-word">금칙어 <span className="text-destructive">*</span></Label>
              <Input
                id="fw-word"
                placeholder="예: 파업"
                value={formWord}
                onChange={e => { setFormWord(e.target.value); setFormError(""); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fw-reason">등록 사유 <span className="text-destructive">*</span></Label>
              <Textarea
                id="fw-reason"
                placeholder="예: 노사 갈등 조장 우려"
                value={formReason}
                onChange={e => { setFormReason(e.target.value); setFormError(""); }}
                rows={3}
              />
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>취소</Button>
              <Button onClick={handleFormSave}>
                {editTarget ? "수정" : "등록"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Delete Confirmation Dialog                                           */}
      {/* ------------------------------------------------------------------ */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>금칙어 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              금칙어 <span className="font-semibold text-foreground">"{deleteTarget?.word}"</span>을(를) 삭제하시겠습니까?
              삭제 후에는 해당 단어가 콘텐츠 작성 시 제한되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ------------------------------------------------------------------ */}
      {/* CSV Bulk Import Dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={isCsvOpen} onOpenChange={setIsCsvOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>CSV 일괄 등록</DialogTitle>
            <DialogDescription>
              CSV 파일을 업로드하거나 직접 붙여넣기 하세요. 형식:{" "}
              <code className="bg-muted px-1 rounded text-xs">금칙어,등록사유</code>
              (사유 생략 시 "일괄 등록"으로 처리)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* File upload */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                파일 선택 (.csv / .txt)
              </Button>
              <span className="text-xs text-muted-foreground">또는 아래에 직접 입력</span>
            </div>

            {/* Text input */}
            <div className="space-y-1.5">
              <Label>내용 입력</Label>
              <Textarea
                placeholder={"파업,노사 갈등 조장 우려\n시위,정치적 표현 규제\n광고"}
                value={csvText}
                onChange={e => handleCsvTextChange(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Error */}
            {csvError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {csvError}
              </div>
            )}

            {/* Preview */}
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">미리보기</Label>
                  <span className="text-xs text-muted-foreground">
                    총 {csvPreview.length}개 (이미 등록된 단어 제외 후 추가됩니다)
                  </span>
                </div>
                <div className="rounded-md border max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 text-xs">금칙어</TableHead>
                        <TableHead className="py-2 text-xs">사유</TableHead>
                        <TableHead className="py-2 text-xs w-16">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((p, i) => {
                        const isDup = words.some(w => w.word === p.word);
                        return (
                          <TableRow key={i} className={isDup ? "opacity-40" : ""}>
                            <TableCell className="py-1.5 text-sm font-mono">{p.word}</TableCell>
                            <TableCell className="py-1.5 text-sm text-muted-foreground">{p.reason}</TableCell>
                            <TableCell className="py-1.5">
                              {isDup
                                ? <Badge variant="secondary" className="text-xs">중복</Badge>
                                : <Badge variant="outline" className="text-xs text-green-600 border-green-600">신규</Badge>
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCsvOpen(false)}>취소</Button>
              <Button
                onClick={handleCsvImport}
                disabled={csvPreview.length === 0 || csvPreview.every(p => words.some(w => w.word === p.word))}
              >
                <Plus className="h-4 w-4 mr-2" />
                {csvPreview.filter(p => !words.some(w => w.word === p.word)).length}개 등록
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
