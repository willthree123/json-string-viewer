import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";

function SqlPage() {
  const [input, setInput] = useState("");

  const output = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `('${line}')`)
    .join(",\n");

  const handleCopy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="h-screen bg-background p-6 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SQL List Formatter</h1>
            <p className="text-default-500 text-sm mt-1">
              Paste values one per line — converts to SQL tuple format
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="flat" color="default" size="sm" onPress={handleCopy} isDisabled={!output}>
              Copy Output
            </Button>
            <Button variant="flat" color="default" size="sm" onPress={handleClear}>
              Clear
            </Button>
            <Link to="/">
              <Button variant="flat" color="primary" size="sm">
                ← JSON Viewer
              </Button>
            </Link>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Input */}
          <Card shadow="sm" className="w-full h-full flex flex-col">
            <CardHeader className="px-4 py-3">
              <span className="font-semibold text-foreground">Input</span>
              <span className="text-xs text-default-400 ml-2">(one value per line)</span>
            </CardHeader>
            <Divider />
            <CardBody className="p-0 overflow-hidden flex-1 min-h-0">
              <textarea
                className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] p-4 resize-none outline-none border-none"
                placeholder={"RIF_26_10219\nRIF_26_10220\nRIF_26_10221"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
              />
            </CardBody>
          </Card>

          {/* Output */}
          <Card shadow="sm" className="w-full h-full flex flex-col">
            <CardHeader className="px-4 py-3">
              <span className="font-semibold text-foreground">Output</span>
              <span className="text-xs text-default-400 ml-2">(SQL tuples)</span>
            </CardHeader>
            <Divider />
            <CardBody className="p-0 overflow-hidden flex-1 min-h-0">
              <textarea
                className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] p-4 resize-none outline-none border-none"
                value={output}
                readOnly
                spellCheck={false}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SqlPage;
