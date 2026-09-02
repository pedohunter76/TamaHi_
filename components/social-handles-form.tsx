"use client";

import { Camera, Check, Copy, ExternalLink, Globe, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  copyToClipboard,
  getFacebookUrl,
  getInstagramUrl,
  loadSavedUserSocials,
  saveUserSocials,
  type UserSocials,
} from "@/lib/profile/socials";

export function SocialHandlesForm() {
  const [socials, setSocials] = useState<UserSocials>(() => loadSavedUserSocials());
  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveUserSocials(socials);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleCopy(key: string, url: string) {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  const hasAnySocial = Boolean(socials.instagram?.trim() || socials.facebook?.trim());
  const igUrl = socials.instagram?.trim() ? getInstagramUrl(socials.instagram) : "";
  const fbUrl = socials.facebook?.trim() ? getFacebookUrl(socials.facebook) : "";

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Instagram Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <span className="flex size-5 items-center justify-center rounded-md bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white">
                <Camera className="size-3" />
              </span>
              <span>Instagram Handle</span>
            </label>
            {igUrl ? (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#bc1888] hover:underline"
              >
                <span>Test Link</span>
                <ExternalLink className="size-2.5" />
              </a>
            ) : null}
          </div>
          <Input
            placeholder="@yourinstagram"
            value={socials.instagram || ""}
            onChange={(e) =>
              setSocials({ ...socials, instagram: e.target.value })
            }
            className="h-10 rounded-xl bg-white text-xs"
          />
        </div>

        {/* Facebook Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <span className="flex size-5 items-center justify-center rounded-md bg-[#1877f2] text-white">
                <Globe className="size-3" />
              </span>
              <span>Facebook Profile / Link</span>
            </label>
            {fbUrl ? (
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1877f2] hover:underline"
              >
                <span>Test Link</span>
                <ExternalLink className="size-2.5" />
              </a>
            ) : null}
          </div>
          <Input
            placeholder="facebook.com/yourprofile or username"
            value={socials.facebook || ""}
            onChange={(e) =>
              setSocials({ ...socials, facebook: e.target.value })
            }
            className="h-10 rounded-xl bg-white text-xs"
          />
        </div>
      </div>

      {/* Live Card Preview */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[#006633]/20 bg-[#f0faf5] p-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#006633]">
          <Sparkles className="size-3.5 text-[#FDB913]" />
          <span>Live Batch Card Preview</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          How batchmates in your 24-hour room will see your contact details when you share:
        </p>

        {hasAnySocial ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {socials.instagram?.trim() ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-1.5 shadow-2xs">
                <span className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white">
                  <Camera className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-foreground">
                  @{socials.instagram.trim().replace(/^@/, "")}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("ig", igUrl)}
                  className="rounded p-1 text-muted-foreground hover:bg-[#f3f4f6] hover:text-foreground"
                  title="Copy Instagram URL"
                >
                  {copiedKey === "ig" ? (
                    <Check className="size-3 text-[#006633]" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            ) : null}

            {socials.facebook?.trim() ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-1.5 shadow-2xs">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#1877f2] text-white">
                  <Globe className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-foreground">
                  Facebook Profile
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("fb", fbUrl)}
                  className="rounded p-1 text-muted-foreground hover:bg-[#f3f4f6] hover:text-foreground"
                  title="Copy Facebook URL"
                >
                  {copiedKey === "fb" ? (
                    <Check className="size-3 text-[#006633]" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white/70 p-3 text-center text-xs text-muted-foreground">
            Type your Instagram or Facebook handle above to see a live preview.
          </div>
        )}
      </div>

      {/* Save Button & Status */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-muted-foreground">
          {saved ? "✓ Social handles saved to your device!" : "Never shared automatically without your consent."}
        </p>

        <Button
          type="submit"
          className="h-10 rounded-xl bg-[#006633] px-5 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
        >
          {saved ? "Saved! ✓" : "Save Handles"}
        </Button>
      </div>
    </form>
  );
}
