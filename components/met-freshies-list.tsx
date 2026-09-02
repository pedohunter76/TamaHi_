"use client";

import { Download, FileText, GraduationCap, PenSquare, Search, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  MemberProfileModal,
  type MemberModalData,
} from "@/components/member-profile-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSTITUTES } from "@/lib/profile/constants";
import {
  loadAllFreshieNotes,
  saveFreshieNote,
  type FreshieNote,
} from "@/lib/profile/notes";
import { cn } from "@/lib/utils";

function formatMetDate(isoString: string | null): string {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type MetFreshie = {
  id: string;
  nickname: string;
  instituteShort: string | null;
  institute: string | null;
  course: string | null;
  vibes?: number[] | null;
  metAt: string | null;
};

const INSTITUTE_FILTERS = [
  "All",
  ...INSTITUTES.map((inst) => inst.shortName),
];

export function MetFreshiesList({
  members,
  currentUserVibes,
}: {
  members: MetFreshie[];
  currentUserVibes?: number[] | null;
}) {
  const [selectedMember, setSelectedMember] = useState<MemberModalData | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState("All");
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);

  const [notes, setNotes] = useState<Record<string, FreshieNote>>(() =>
    loadAllFreshieNotes(),
  );
  const [editingNoteUserId, setEditingNoteUserId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (!editingNoteUserId) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditingNoteUserId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingNoteUserId]);

  function openNoteEditor(userId: string, currentNote: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingNoteUserId(userId);
    setNoteDraft(currentNote);
  }

  function handleSaveNote(userId: string) {
    saveFreshieNote(userId, noteDraft);
    setNotes(loadAllFreshieNotes());
    setEditingNoteUserId(null);
  }

  function handleExportCsv() {
    if (members.length === 0) return;

    const headers = ["Nickname", "Institute", "Course", "Date Met", "Private Note"];
    const rows = members.map((m) => {
      const userNote = (notes[m.id]?.note || "").replace(/"/g, '""');
      const nickname = m.nickname.replace(/"/g, '""');
      const institute = (m.institute || "FEU").replace(/"/g, '""');
      const course = (m.course || "").replace(/"/g, '""');
      const dateMet = m.metAt ? new Date(m.metAt).toLocaleDateString() : "Recently";

      return `"${nickname}","${institute}","${course}","${dateMet}","${userNote}"`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FEU_Tamaraw_Circle_Contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.nickname.toLowerCase().includes(search.toLowerCase()) ||
      (m.course && m.course.toLowerCase().includes(search.toLowerCase())) ||
      (m.instituteShort &&
        m.instituteShort.toLowerCase().includes(search.toLowerCase()));

    const matchesInstitute =
      selectedInstitute === "All" || m.instituteShort === selectedInstitute;

    const matchesNotes = !onlyWithNotes || Boolean(notes[m.id]?.note?.trim());

    return matchesSearch && matchesInstitute && matchesNotes;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search connections by nickname or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl bg-white pl-9.5 text-xs shadow-2xs"
          />
        </div>

        {/* Action & Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={members.length === 0}
            className="h-8 gap-1.5 rounded-full border-[#006633]/30 bg-white px-3 text-xs font-extrabold text-[#006633] hover:bg-[#f0faf5]"
            title="Download CSV contacts backup"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <button
            type="button"
            onClick={() => setOnlyWithNotes(!onlyWithNotes)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-all",
              onlyWithNotes
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-muted-foreground hover:bg-[#f3f4f6] border border-[#e5e7eb]",
            )}
          >
            📝 Notes Only
          </button>

          {INSTITUTE_FILTERS.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedInstitute(code)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-all",
                selectedInstitute === code
                  ? "bg-[#006633] text-[#FDB913] shadow-xs"
                  : "bg-white text-muted-foreground hover:bg-[#f3f4f6] border border-[#e5e7eb]",
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Met Freshies */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white/60 p-10 text-center text-xs text-muted-foreground">
          No matching connections found for &ldquo;{search || selectedInstitute}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const userNote = notes[member.id]?.note || "";

            return (
              <div
                key={member.id}
                onClick={() =>
                  setSelectedMember({
                    id: member.id,
                    nickname: member.nickname,
                    institute: member.institute,
                    course: member.course,
                    vibes: member.vibes,
                    currentUserVibes,
                  })
                }
                className="glass-card group relative flex cursor-pointer flex-col justify-between gap-3.5 rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#006633] hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#006633] font-bold text-white shadow-xs">
                    {member.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-base font-bold text-foreground">
                        {member.nickname}
                      </h2>
                      {member.instituteShort ? (
                        <span className="shrink-0 rounded-sm border border-[#e5e7eb] bg-[#f0faf5] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#006633]">
                          {member.instituteShort}
                        </span>
                      ) : null}
                    </div>
                    {member.course ? (
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <GraduationCap className="size-3.5 shrink-0 text-[#006633]" />
                        <span className="truncate">{member.course}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">FEU Freshie</p>
                    )}
                  </div>
                </div>

                {/* Private Memory Note */}
                {userNote ? (
                  <div className="flex items-start gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50/70 p-2 text-xs text-amber-900">
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    <p className="line-clamp-2 text-[11px] leading-relaxed italic">
                      &quot;{userNote}&quot;
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-[#e5e7eb]/70 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[#006633]">
                    <Sparkles className="size-3 text-[#FDB913]" />
                    View Vibe Match
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => openNoteEditor(member.id, userNote, e)}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:bg-[#f0faf5] hover:text-[#006633]"
                      title="Add or edit private memory note"
                    >
                      <PenSquare className="size-3" />
                      <span>{userNote ? "Edit Note" : "+ Note"}</span>
                    </button>
                    <span className="font-medium text-[11px]">{formatMetDate(member.metAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Private Note Editor Modal */}
      {editingNoteUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="glass-card flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-card-lg animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenSquare className="size-4 text-[#006633]" />
                <h3 className="text-sm font-bold text-foreground">
                  Private Freshie Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingNoteUserId(null)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-[#f3f4f6]"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Only you can see this note (e.g., &quot;Met in Room 2, loves basketball &amp; coffee&quot;).
            </p>

            <Input
              placeholder="e.g. Met in Block 4 chat, taking BS CS, loves anime"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingNoteUserId(null)}
                className="h-9 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveNote(editingNoteUserId)}
                className="h-9 rounded-xl bg-[#006633] px-4 text-xs font-bold text-[#FDB913] hover:bg-[#004d26]"
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <MemberProfileModal
        member={selectedMember}
        currentUserVibes={currentUserVibes}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}

