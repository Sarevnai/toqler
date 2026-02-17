import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { parseColorToHex, isValidColor } from "@/lib/color-utils";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export default function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [text, setText] = useState(value);
  const valid = isValidColor(text);
  const hexForPicker = parseColorToHex(text) || "#000000";

  // Sync external value changes
  useEffect(() => {
    setText(value);
  }, [value]);

  const handleTextChange = (v: string) => {
    setText(v);
    const parsed = parseColorToHex(v);
    if (parsed) onChange(parsed);
  };

  const handlePickerChange = (hex: string) => {
    setText(hex);
    onChange(hex);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexForPicker}
          onChange={(e) => handlePickerChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5 bg-background"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="#RRGGBB ou rgb(r,g,b)"
          className={`flex h-10 flex-1 rounded-xl border px-3 py-2 text-sm bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            !valid && text.length > 0 ? "border-destructive" : "border-input"
          }`}
        />
      </div>
      {!valid && text.length > 0 && (
        <p className="text-xs text-destructive">Formato inválido. Use hex (#RRGGBB) ou rgb(r,g,b)</p>
      )}
    </div>
  );
}
