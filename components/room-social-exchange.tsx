"use client";

import {
  Check,
  ChevronDown,
  ExternalLink,
  Lock,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getFacebookUrl,
  getInstagramUrl,
  loadSavedUserSocials,
  saveUserSocials,
  type UserSocials,
} from "@/lib/profile/socials";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { RoomParticipant } from "@/components/room-chat";

export type SocialConsentPayload = {
  userId: string;
  agreed: boolean;
  socials: UserSocials;
};

export function RoomSocialExchange({
  roomId,
  currentUserId,
  roster = [],
  disabled,
}: {
  roomId: string;
  currentUserId: string;
  roster?: RoomParticipant[];
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mySocials, setMySocials] = useState<UserSocials>(() =>
    loadSavedUserSocials(),
  );
  const [myAgreed, setMyAgreed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(`tamahi_consent_${roomId}_${currentUserId}`) === "true";
    } catch {
      return false;
    }
  });

  const myAgreedRef = useRef(myAgreed);
  const mySocialsRef = useRef(mySocials);

  useEffect(() => {
    myAgreedRef.current = myAgreed;
    mySocialsRef.current = mySocials;
  }, [myAgreed, mySocials]);

  // Store consents from all 4 room members: userId -> { agreed, socials }
  const [consents, setConsents] = useState<
    Record<string, { agreed: boolean; socials: UserSocials }>
  >({});

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const totalMembers = Math.max(1, roster.length || 4);

  // Sync via Realtime Broadcast on isolated channel with automatic Handshake
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`social-consent:${roomId}`);

    channel
      .on("broadcast", { event: "social_consent" }, ({ payload }) => {
        const data = payload as SocialConsentPayload;
        if (!data?.userId) return;

        setConsents((prev) => ({
          ...prev,
          [data.userId]: {
            agreed: data.agreed,
            socials: data.socials || {},
          },
        }));
      })
      .on("broadcast", { event: "request_social_sync" }, () => {
        // Peer just joined or refreshed; respond with our current consent if we agreed
        if (myAgreedRef.current) {
          void channel.send({
            type: "broadcast",
            event: "social_consent",
            payload: {
              userId: currentUserId,
              agreed: true,
              socials: mySocialsRef.current,
            } satisfies SocialConsentPayload,
          });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Request sync from any online peers in the room
          void channel.send({
            type: "broadcast",
            event: "request_social_sync",
            payload: { from: currentUserId },
          });

          // Also broadcast our own consent if already agreed
          if (myAgreedRef.current) {
            void channel.send({
              type: "broadcast",
              event: "social_consent",
              payload: {
                userId: currentUserId,
                agreed: true,
                socials: mySocialsRef.current,
              } satisfies SocialConsentPayload,
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, currentUserId]);

  function handleToggleConsent(e: React.FormEvent) {
    e.preventDefault();
    const nextAgreed = !myAgreed;
    setMyAgreed(nextAgreed);
    saveUserSocials(mySocials);

    try {
      localStorage.setItem(`tamahi_consent_${roomId}_${currentUserId}`, String(nextAgreed));
    } catch {
      // ignore
    }

    const nextConsents = {
      ...consents,
      [currentUserId]: {
        agreed: nextAgreed,
        socials: mySocials,
      },
    };
    setConsents(nextConsents);

    // Broadcast to the other members in the room via dedicated channel
    if (channelRef.current) {
      void channelRef.current.send({
        type: "broadcast",
        event: "social_consent",
        payload: {
          userId: currentUserId,
          agreed: nextAgreed,
          socials: mySocials,
        } satisfies SocialConsentPayload,
      });
    }
  }

  // Count agreed members (include self if agreed)
  const agreedUsers = new Set<string>();
  if (myAgreed) agreedUsers.add(currentUserId);
  for (const [uid, consent] of Object.entries(consents)) {
    if (consent.agreed) agreedUsers.add(uid);
  }

  const agreedCount = agreedUsers.size;
  // All members must agree (e.g. 4/4)
  const isUnlocked = agreedCount >= totalMembers && totalMembers > 0;

  if (disabled) return null;

  return (
    <div className="relative flex flex-col gap-2">
      {/* Trigger Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all",
            isUnlocked
              ? "bg-[#006633] text-[#FDB913] shadow-xs"
              : isOpen
                ? "bg-[#006633] text-white shadow-xs"
                : "bg-[#f0faf5] text-[#006633] hover:bg-[#e2f5ec]",
          )}
        >
          {isUnlocked ? (
            <Unlock className="size-3.5 text-[#FDB913]" />
          ) : (
            <Lock className="size-3.5" />
          )}
          <span>
            {isUnlocked
              ? "Socials Unlocked (4/4)"
              : `Unlock Socials (${agreedCount}/${totalMembers})`}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isUnlocked ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#006633] animate-pulse">
            <Sparkles className="size-3 text-[#FDB913]" />
            All 4 Agreed!
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground">
            {agreedCount === 0
              ? "Requires 4/4 consent"
              : `${totalMembers - agreedCount} more needed`}
          </span>
        )}
      </div>

      {/* Expanded Consent & Socials Widget */}
      {isOpen ? (
        <div className="glass-card flex flex-col gap-3.5 rounded-2xl border-[1.5px] border-[#006633]/25 bg-white p-4 shadow-card-sm animate-in fade-in zoom-in-98 duration-150">
          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-white",
                  isUnlocked ? "bg-[#006633]" : "bg-amber-600",
                )}
              >
                {isUnlocked ? (
                  <Unlock className="size-4 text-[#FDB913]" />
                ) : (
                  <Lock className="size-4" />
                )}
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isUnlocked
                    ? "🎉 Mutual Socials Unlocked"
                    : "🔒 Mutual 4-Person Consent"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {isUnlocked
                    ? "All 4 members agreed! Click any account to view their profile."
                    : "Instagram & Facebook accounts are hidden until all 4 members agree."}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#006633]">Room Agreement Status</span>
              <span className="text-foreground">
                {agreedCount} of {totalMembers} Tamaraws Agreed
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((agreedCount / totalMembers) * 100))}%`,
                  background: isUnlocked
                    ? "#006633"
                    : "linear-gradient(90deg, #FDB913, #006633)",
                }}
              />
            </div>
          </div>

          {/* 1. UNLOCKED STATE: Direct Clickable IG & FB Links */}
          {isUnlocked ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-[#006633]/30 bg-[#f0faf5] p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#006633]">
                Click any handle for automatic redirection:
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roster.map((member) => {
                  const isMe = member.userId === currentUserId;
                  const memberSocials = isMe
                    ? mySocials
                    : consents[member.userId]?.socials || {};

                  const ig = memberSocials.instagram?.trim();
                  const fb = memberSocials.facebook?.trim();

                  return (
                    <div
                      key={member.userId}
                      className="flex flex-col gap-1.5 rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#006633] text-[10px] font-bold text-white">
                          {member.nickname.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {member.nickname} {isMe ? "(You)" : ""}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 pt-1">
                        {/* Instagram Link (Direct Redirection) */}
                        {ig ? (
                          <a
                            href={getInstagramUrl(ig)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-[#e1306c] hover:bg-[#fff5f8] hover:text-[#e1306c]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span>📷</span>
                              <span className="truncate">@{ig.replace(/^@/, "")}</span>
                            </span>
                            <ExternalLink className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] italic text-muted-foreground">
                            No Instagram provided
                          </span>
                        )}

                        {/* Facebook Link (Direct Redirection) */}
                        {fb ? (
                          <a
                            href={getFacebookUrl(fb)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-[#1877f2] hover:bg-[#f0f6ff] hover:text-[#1877f2]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span>🌐</span>
                              <span className="truncate">{fb.replace(/^https?:\/\/(www\.)?facebook\.com\//, "")}</span>
                            </span>
                            <ExternalLink className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] italic text-muted-foreground">
                            No Facebook provided
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 2. LOCKED STATE: Opt-in Form & Handle Inputs */
            <form onSubmit={handleToggleConsent} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-foreground">
                    Your Instagram Handle
                  </label>
                  <Input
                    placeholder="@yourhandle"
                    value={mySocials.instagram || ""}
                    onChange={(e) =>
                      setMySocials({ ...mySocials, instagram: e.target.value })
                    }
                    className="h-8 rounded-lg bg-[#f9fafb] text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-foreground">
                    Your Facebook Profile / Username
                  </label>
                  <Input
                    placeholder="facebook.com/yourprofile"
                    value={mySocials.facebook || ""}
                    onChange={(e) =>
                      setMySocials({ ...mySocials, facebook: e.target.value })
                    }
                    className="h-8 rounded-lg bg-[#f9fafb] text-xs"
                  />
                </div>
              </div>

              {/* Consent Toggle Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-[#e5e7eb]">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {myAgreed ? (
                    <span className="flex items-center gap-1 font-bold text-[#006633]">
                      <Check className="size-3.5 text-[#006633]" />
                      You agreed to reveal
                    </span>
                  ) : (
                    <span>Click below to give your consent:</span>
                  )}
                </div>

                <Button
                  type="submit"
                  className={cn(
                    "h-9 rounded-xl px-4 text-xs font-extrabold transition-all",
                    myAgreed
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "bg-[#006633] text-[#FDB913] shadow-cta hover:bg-[#004d26]",
                  )}
                >
                  {myAgreed ? "Withdraw Consent" : "✅ I Agree to Share (1/4)"}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
