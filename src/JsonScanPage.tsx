import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";

const MAX_STRING_LENGTH = 255;

type Issue = {
  path: string;
  value: string;
  length: number;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

const renderJsonWithHighlights = (value: unknown, indent = 0): string => {
  const pad = "  ".repeat(indent);

  if (typeof value === "string") {
    const rendered = JSON.stringify(value);
    const safe = escapeHtml(rendered);
    return value.length > MAX_STRING_LENGTH
      ? `<mark class="rounded border border-red-400/50 bg-red-500/15 px-1 py-0.5 text-red-200">${safe}</mark>`
      : safe;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";

    const inner = value
      .map((item) => `${"  ".repeat(indent + 1)}${renderJsonWithHighlights(item, indent + 1)}`)
      .join(",\n");

    return `[\n${inner}\n${pad}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";

    const inner = entries
      .map(([key, item]) => {
        const itemRendered = renderJsonWithHighlights(item, indent + 1);
        return `${"  ".repeat(indent + 1)}${escapeHtml(JSON.stringify(key))}: ${itemRendered}`;
      })
      .join(",\n");

    return `{\n${inner}\n${pad}}`;
  }

  return "null";
};

const collectIssues = (value: unknown, path = "$", issues: Issue[] = []): Issue[] => {
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) {
      issues.push({ path, value, length: value.length });
    }
    return issues;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectIssues(item, `${path}[${index}]`, issues));
    return issues;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectIssues(item, `${path}.${key}`, issues));
  }

  return issues;
};

function JsonScanPage() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) {
      return { issues: [] as Issue[], parsed: null as unknown, error: null as string | null };
    }

    try {
      const parsed = JSON.parse(input);
      const issues = collectIssues(parsed);
      return { issues, parsed, error: null };
    } catch {
      return { issues: [] as Issue[], parsed: null as unknown, error: "Invalid JSON — check syntax and try again." };
    }
  }, [input]);

  const highlightedJson = result.parsed ? renderJsonWithHighlights(result.parsed) : "";

  return (
    <div className="h-screen bg-background p-6 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">JSON Body Scanner</h1>
            <p className="text-default-500 text-sm mt-1">Checks for any string longer than 255 characters and highlights it</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="flat" color="primary" size="sm">
                ← JSON Viewer
              </Button>
            </Link>
            <Link to="/sql">
              <Button variant="flat" color="default" size="sm">
                SQL →
              </Button>
            </Link>
          </div>
        </div>

        <Card shadow="sm" className="w-full">
          <CardHeader className="px-4 py-3">
            <span className="font-semibold text-foreground">Scan JSON</span>
          </CardHeader>
          <Divider />
          <CardBody className="p-0">
            <textarea
              className="w-full min-h-[260px] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] p-4 resize-y outline-none border-none"
              placeholder={'{\n  "message": "This is a very long string..."\n}'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
          </CardBody>
        </Card>

        {result.error ? (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {result.error}
          </div>
        ) : result.issues.length > 0 ? (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <div className="font-semibold mb-2">Found {result.issues.length} string value(s) longer than {MAX_STRING_LENGTH} characters:</div>
            <ul className="list-disc list-inside space-y-1">
              {result.issues.map((issue) => (
                <li key={`${issue.path}-${issue.length}`}>
                  {issue.path} — {issue.length} chars
                </li>
              ))}
            </ul>
          </div>
        ) : input.trim() ? (
          <div className="rounded-lg border border-green-400/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            All JSON string values are within the {MAX_STRING_LENGTH}-character limit.
          </div>
        ) : null}

        <Card shadow="sm" className="w-full flex-1 min-h-0">
          <CardHeader className="px-4 py-3">
            <span className="font-semibold text-foreground">Highlighted JSON</span>
          </CardHeader>
          <Divider />
          <CardBody className="p-0 overflow-auto min-h-[260px]">
            {result.parsed ? (
              <pre
                className="min-h-[260px] whitespace-pre-wrap break-words bg-[#1e1e1e] p-4 font-mono text-[13px] text-[#d4d4d4]"
                dangerouslySetInnerHTML={{ __html: highlightedJson }}
              />
            ) : (
              <div className="min-h-[260px] bg-[#1e1e1e] p-4 text-sm text-default-400">
                Paste a JSON body to scan.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default JsonScanPage;
