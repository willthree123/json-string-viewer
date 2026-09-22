import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Card, CardBody, CardHeader, Chip, Divider, Button, Tooltip } from "@heroui/react";

const STORAGE_STRING_KEY = "jsv-string";
const STORAGE_JSON_KEY = "jsv-json";
const MAX_HISTORY = 10;

type Snapshot = { string: string; json: string };

function StatusChip({ error, hasValue }: Readonly<{ error: string | null; hasValue: boolean }>) {
  if (error)
    return (
      <Chip color="danger" size="sm" variant="flat">
        Invalid
      </Chip>
    );
  if (hasValue)
    return (
      <Chip color="success" size="sm" variant="flat">
        Valid
      </Chip>
    );
  return null;
}

function App() {
  const [stringValue, setStringValue] = useState<string>(() => localStorage.getItem(STORAGE_STRING_KEY) ?? "");
  const [jsonValue, setJsonValue] = useState<string>(() => localStorage.getItem(STORAGE_JSON_KEY) ?? "");
  const [stringError, setStringError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [swapped, setSwapped] = useState(false);

  // Snapshot history in refs (avoids stale-closure issues in callbacks)
  const historyRef = useRef<Snapshot[]>(
    ((): Snapshot[] => {
      const s = localStorage.getItem(STORAGE_STRING_KEY) ?? "";
      const j = localStorage.getItem(STORAGE_JSON_KEY) ?? "";
      return s || j ? [{ string: s, json: j }] : [];
    })(),
  );
  const indexRef = useRef<number>(historyRef.current.length - 1);

  // Stable refs so Monaco keybinding closures always call the latest version
  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});

  const saveStorage = (s: string, j: string) => {
    localStorage.setItem(STORAGE_STRING_KEY, s);
    localStorage.setItem(STORAGE_JSON_KEY, j);
  };

  const applySnapshot = useCallback((snap: Snapshot) => {
    setStringValue(snap.string);
    setJsonValue(snap.json);
    setStringError(null);
    setJsonError(null);
    saveStorage(snap.string, snap.json);
  }, []);

  const refreshUndoRedo = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(
    (snap: Snapshot) => {
      // Discard any redo tail
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
      historyRef.current.push(snap);
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      indexRef.current = historyRef.current.length - 1;
      refreshUndoRedo();
    },
    [refreshUndoRedo],
  );

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current -= 1;
    applySnapshot(historyRef.current[indexRef.current]);
    refreshUndoRedo();
  }, [applySnapshot, refreshUndoRedo]);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    indexRef.current += 1;
    applySnapshot(historyRef.current[indexRef.current]);
    refreshUndoRedo();
  }, [applySnapshot, refreshUndoRedo]);

  // Keep refs fresh on every render
  undoRef.current = undo;
  redoRef.current = redo;

  const handleStringChange = useCallback(
    (value: string) => {
      setStringValue(value);
      if (!value.trim()) {
        setJsonValue("");
        setStringError(null);
        setJsonError(null);
        return;
      }
      try {
        // Left panel is double-stringified: "{\"..\"}" — parse once to get inner JSON string,
        // parse again to get the actual object
        const innerString = JSON.parse(value); // first parse: string → inner JSON string
        const obj = JSON.parse(innerString); // second parse: inner JSON string → object
        const pretty = JSON.stringify(obj, null, 2);
        const doubleStringified = JSON.stringify(JSON.stringify(obj));
        setStringValue(doubleStringified);
        setJsonValue(pretty);
        setStringError(null);
        setJsonError(null);
        saveStorage(doubleStringified, pretty);
        pushHistory({ string: doubleStringified, json: pretty });
      } catch {
        setStringError("Invalid JSON — check syntax and try again");
        setJsonValue("");
      }
    },
    [pushHistory],
  );

  const handleJsonChange = useCallback(
    (value: string) => {
      setJsonValue(value);
      if (!value.trim()) {
        setStringValue("");
        setJsonError(null);
        setStringError(null);
        return;
      }
      try {
        const obj = JSON.parse(value);
        const pretty = JSON.stringify(obj, null, 2);
        const doubleStringified = JSON.stringify(JSON.stringify(obj));
        setJsonValue(pretty);
        setStringValue(doubleStringified);
        setJsonError(null);
        setStringError(null);
        saveStorage(doubleStringified, pretty);
        pushHistory({ string: doubleStringified, json: pretty });
      } catch {
        setJsonError("Invalid JSON — check syntax and try again");
        setStringValue("");
      }
    },
    [pushHistory],
  );

  const removePersistenceKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(removePersistenceKeys);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([k]) => !/^persistence/i.test(k))
          .map(([k, v]) => [k, removePersistenceKeys(v)]),
      );
    }
    return value;
  };

  const handleRemovePersistence = useCallback(() => {
    if (!jsonValue.trim()) return;
    try {
      const obj = JSON.parse(jsonValue);
      const cleaned = removePersistenceKeys(obj);
      const pretty = JSON.stringify(cleaned, null, 2);
      const doubleStringified = JSON.stringify(JSON.stringify(cleaned));
      setJsonValue(pretty);
      setStringValue(doubleStringified);
      setJsonError(null);
      setStringError(null);
      saveStorage(doubleStringified, pretty);
      pushHistory({ string: doubleStringified, json: pretty });
    } catch {
      // ignore if JSON is currently invalid
    }
  }, [jsonValue, pushHistory]);

  const handleClear = useCallback(() => {
    setStringValue("");
    setJsonValue("");
    setStringError(null);
    setJsonError(null);
    localStorage.removeItem(STORAGE_STRING_KEY);
    localStorage.removeItem(STORAGE_JSON_KEY);
    pushHistory({ string: "", json: "" });
  }, [pushHistory]);

  // Override Monaco's built-in Ctrl+Z / Ctrl+Y with our snapshot undo/redo
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => undoRef.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => redoRef.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => redoRef.current());
  }, []);

  const baseOptions = {
    minimap: { enabled: false },
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    fontSize: 13,
    automaticLayout: true,
    formatOnPaste: true,
    renderLineHighlight: "line" as const,
    folding: true,
    tabSize: 2,
  };

  const stringPanel = (
    <Card shadow="sm" className="w-full h-full flex flex-col">
      <CardHeader className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">JSON String</span>
          <span className="text-xs text-default-400">(double-stringified)</span>
        </div>
        <StatusChip error={stringError} hasValue={!!stringValue} />
      </CardHeader>
      <Divider />
      <CardBody className="p-0 overflow-hidden flex-1 min-h-0">
        <Editor height="100%" language="json" theme="vs-dark" value={stringValue} onChange={(val) => handleStringChange(val ?? "")} onMount={handleEditorMount} options={{ ...baseOptions, wordWrap: "on" }} />
        {stringError && <div className="px-3 py-2 text-xs text-danger bg-danger-50 border-t border-danger-200">{stringError}</div>}
      </CardBody>
    </Card>
  );

  const jsonPanel = (
    <Card shadow="sm" className="w-full h-full flex flex-col">
      <CardHeader className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Formatted JSON</span>
          <span className="text-xs text-default-400">(pretty printed)</span>
        </div>
        <StatusChip error={jsonError} hasValue={!!jsonValue} />
      </CardHeader>
      <Divider />
      <CardBody className="p-0 overflow-hidden flex-1 min-h-0">
        <Editor height="100%" language="json" theme="vs-dark" value={jsonValue} onChange={(val) => handleJsonChange(val ?? "")} onMount={handleEditorMount} options={{ ...baseOptions, wordWrap: "off" }} />
        {jsonError && <div className="px-3 py-2 text-xs text-danger bg-danger-50 border-t border-danger-200">{jsonError}</div>}
      </CardBody>
    </Card>
  );

  return (
    <div className="h-screen bg-background p-6 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">JSON String Viewer</h1>
            <p className="text-default-500 text-sm mt-1">Paste on either side — converts bidirectionally in real time</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Swap panels" placement="bottom">
              <Button variant="flat" color="default" size="sm" onPress={() => setSwapped((s) => !s)}>
                ⇄ Swap
              </Button>
            </Tooltip>
            <Tooltip content="Undo (Ctrl+Z)" placement="bottom">
              <Button variant="flat" color="default" size="sm" isDisabled={!canUndo} onPress={undo}>
                Undo
              </Button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)" placement="bottom">
              <Button variant="flat" color="default" size="sm" isDisabled={!canRedo} onPress={redo}>
                Redo
              </Button>
            </Tooltip>
            <Tooltip content="Remove all persistence* keys from JSON" placement="bottom">
              <Button variant="flat" color="warning" size="sm" isDisabled={!jsonValue || !!jsonError} onPress={handleRemovePersistence}>
                Remove Persistence
              </Button>
            </Tooltip>
            <Button variant="flat" color="default" size="sm" onPress={handleClear}>
              Clear
            </Button>
            <Link to="/scan-json">
              <Button variant="flat" color="secondary" size="sm">
                Scan JSON →
              </Button>
            </Link>
            <Link to="/sql">
              <Button variant="flat" color="primary" size="sm">
                SQL →
              </Button>
            </Link>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
          {swapped ? jsonPanel : stringPanel}
          {swapped ? stringPanel : jsonPanel}
        </div>
      </div>
    </div>
  );
}

export default App;
