import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { db } from "@workspace/db";
import { fileAnalysesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetFileAnalysisParams, DeleteFileAnalysisParams } from "@workspace/api-zod";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function calcEntropy(buf: Buffer): number {
  const freq = new Array(256).fill(0);
  for (const b of buf) freq[b]++;
  let entropy = 0;
  const len = buf.length;
  for (const f of freq) {
    if (f === 0) continue;
    const p = f / len;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * 1000) / 1000;
}

function extractStrings(buf: Buffer, minLen = 4): string[] {
  const strings: string[] = [];
  let cur = "";
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b >= 0x20 && b <= 0x7e) {
      cur += String.fromCharCode(b);
    } else {
      if (cur.length >= minLen) strings.push(cur);
      cur = "";
    }
  }
  if (cur.length >= minLen) strings.push(cur);
  return strings.slice(0, 500);
}

function hexDump(buf: Buffer, maxBytes = 256): string {
  const lines: string[] = [];
  const slice = buf.slice(0, maxBytes);
  for (let i = 0; i < slice.length; i += 16) {
    const row = slice.slice(i, i + 16);
    const addr = i.toString(16).padStart(8, "0");
    const hex = Array.from(row).map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47);
    const ascii = Array.from(row).map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${addr}  ${hex}  ${ascii}`);
  }
  return lines.join("\n");
}

function detectMime(buf: Buffer, filename: string): string {
  const magic: [number[], string][] = [
    [[0x50, 0x4b, 0x03, 0x04], "application/zip"],
    [[0x4d, 0x5a], "application/x-msdownload"],
    [[0x7f, 0x45, 0x4c, 0x46], "application/x-elf"],
    [[0x25, 0x50, 0x44, 0x46], "application/pdf"],
    [[0xff, 0xd8, 0xff], "image/jpeg"],
    [[0x89, 0x50, 0x4e, 0x47], "image/png"],
    [[0x47, 0x49, 0x46], "image/gif"],
    [[0x52, 0x61, 0x72, 0x21], "application/x-rar-compressed"],
    [[0x1f, 0x8b], "application/gzip"],
    [[0x42, 0x5a, 0x68], "application/x-bzip2"],
    [[0xca, 0xfe, 0xba, 0xbe], "application/java-archive"],
    [[0xd0, 0xcf, 0x11, 0xe0], "application/x-cfb"],
  ];
  for (const [sig, mime] of magic) {
    if (sig.every((b, i) => buf[i] === b)) return mime;
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const extMap: Record<string, string> = {
    js: "application/javascript", ts: "application/typescript", py: "text/x-python",
    sh: "application/x-sh", bat: "application/x-msdos-program", ps1: "application/x-powershell",
    txt: "text/plain", json: "application/json", xml: "application/xml", html: "text/html",
    css: "text/css", md: "text/markdown",
  };
  return extMap[ext] ?? "application/octet-stream";
}

function analyzeSuspicious(buf: Buffer, mime: string, strings: string[]): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const suspiciousStrings = [
    "eval(", "exec(", "base64_decode", "cmd.exe", "powershell", "CreateRemoteThread",
    "VirtualAlloc", "WriteProcessMemory", "ShellExecute", "WScript.Shell",
    "System.Reflection.Assembly", "fromCharCode", "document.write", "XMLHttpRequest",
  ];
  const found = suspiciousStrings.filter((s) => strings.some((str) => str.toLowerCase().includes(s.toLowerCase())));
  if (found.length > 0) reasons.push(`Suspicious strings: ${found.slice(0, 5).join(", ")}`);
  if (mime === "application/x-msdownload") reasons.push("Windows PE executable");
  if (mime === "application/x-elf") reasons.push("ELF binary");
  if (calcEntropy(buf) > 7.2) reasons.push("High entropy (possibly packed/encrypted)");
  if (buf.length > 0 && buf.length < 100 && mime === "application/x-sh") reasons.push("Very small shell script");
  return { isSuspicious: reasons.length > 0, reasons };
}

router.post("/files/analyze", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const buf = req.file.buffer;
  const filename = req.file.originalname;
  const filesize = buf.length;
  const md5 = crypto.createHash("md5").update(buf).digest("hex");
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const entropy = calcEntropy(buf);
  const strings = extractStrings(buf);
  const hex = hexDump(buf);
  const mime = detectMime(buf, filename);
  const { isSuspicious, reasons } = analyzeSuspicious(buf, mime, strings);

  const [row] = await db
    .insert(fileAnalysesTable)
    .values({
      filename,
      filesize,
      mimetype: mime,
      md5,
      sha256,
      entropy,
      strings: strings.join("\n"),
      hexDump: hex,
      metadata: JSON.stringify({ originalName: filename, size: filesize, detectedMime: mime }),
      isSuspicious,
      suspiciousReasons: reasons.length > 0 ? reasons.join("; ") : null,
    })
    .returning();

  return res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/files", async (req, res) => {
  const rows = await db.select().from(fileAnalysesTable).orderBy(fileAnalysesTable.createdAt);
  return res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/files/:id", async (req, res) => {
  const parse = GetFileAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(fileAnalysesTable).where(eq(fileAnalysesTable.id, parse.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/files/:id", async (req, res) => {
  const parse = DeleteFileAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(fileAnalysesTable).where(eq(fileAnalysesTable.id, parse.data.id));
  return res.status(204).send();
});

export default router;
