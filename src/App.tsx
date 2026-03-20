import { useState, useCallback } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Textarea,
  Chip,
  Divider,
  Button,
} from '@heroui/react'

function App() {
  const [stringValue, setStringValue] = useState('')
  const [jsonValue, setJsonValue] = useState('')
  const [stringError, setStringError] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleStringChange = useCallback((value: string) => {
    setStringValue(value)
    if (!value.trim()) {
      setJsonValue('')
      setStringError(null)
      setJsonError(null)
      return
    }
    try {
      const parsed = JSON.parse(value)
      setJsonValue(JSON.stringify(parsed, null, 2))
      setStringError(null)
      setJsonError(null)
    } catch {
      setStringError('Invalid JSON — check syntax and try again')
      setJsonValue('')
    }
  }, [])

  const handleJsonChange = useCallback((value: string) => {
    setJsonValue(value)
    if (!value.trim()) {
      setStringValue('')
      setJsonError(null)
      setStringError(null)
      return
    }
    try {
      const parsed = JSON.parse(value)
      setStringValue(JSON.stringify(parsed))
      setJsonError(null)
      setStringError(null)
    } catch {
      setJsonError('Invalid JSON — check syntax and try again')
      setStringValue('')
    }
  }, [])

  const handleClear = () => {
    setStringValue('')
    setJsonValue('')
    setStringError(null)
    setJsonError(null)
  }

  return (
    <div className="min-h-screen bg-default-50 p-6">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              JSON String Viewer
            </h1>
            <p className="text-default-500 text-sm mt-1">
              Paste on either side — converts bidirectionally in real time
            </p>
          </div>
          <Button
            variant="flat"
            color="default"
            size="sm"
            onPress={handleClear}
          >
            Clear all
          </Button>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-2 gap-6 items-start">
          {/* Left: JSON String (minified / escaped) */}
          <Card shadow="sm" className="w-full">
            <CardHeader className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  JSON String
                </span>
                <span className="text-xs text-default-400">(compact / minified)</span>
              </div>
              {stringError ? (
                <Chip color="danger" size="sm" variant="flat">
                  Invalid
                </Chip>
              ) : stringValue ? (
                <Chip color="success" size="sm" variant="flat">
                  Valid
                </Chip>
              ) : null}
            </CardHeader>
            <Divider />
            <CardBody className="p-3">
              <Textarea
                placeholder={'Paste compact JSON string here…\ne.g. {"name":"John","age":30}'}
                value={stringValue}
                onValueChange={handleStringChange}
                minRows={22}
                maxRows={40}
                isInvalid={!!stringError}
                errorMessage={stringError ?? undefined}
                classNames={{
                  input: 'font-mono text-sm leading-relaxed',
                  inputWrapper: 'h-full',
                }}
                variant="bordered"
              />
            </CardBody>
          </Card>

          {/* Right: Formatted JSON */}
          <Card shadow="sm" className="w-full">
            <CardHeader className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  Formatted JSON
                </span>
                <span className="text-xs text-default-400">(pretty printed)</span>
              </div>
              {jsonError ? (
                <Chip color="danger" size="sm" variant="flat">
                  Invalid
                </Chip>
              ) : jsonValue ? (
                <Chip color="success" size="sm" variant="flat">
                  Valid
                </Chip>
              ) : null}
            </CardHeader>
            <Divider />
            <CardBody className="p-3">
              <Textarea
                placeholder={'Paste or type formatted JSON here…\ne.g.\n{\n  "name": "John",\n  "age": 30\n}'}
                value={jsonValue}
                onValueChange={handleJsonChange}
                minRows={22}
                maxRows={40}
                isInvalid={!!jsonError}
                errorMessage={jsonError ?? undefined}
                classNames={{
                  input: 'font-mono text-sm leading-relaxed',
                  inputWrapper: 'h-full',
                }}
                variant="bordered"
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
