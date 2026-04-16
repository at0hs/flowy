"use client";

import { useState } from "react";
import { updateAiSettings, deleteAiSettings } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AiProviderType } from "@/types";

type Props = {
  initialProvider: AiProviderType | null;
  initialApiKey: string | null;
  initialEndpointUrl: string | null;
  initialModelName: string | null;
};

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  ollama: "Ollama",
  gemini: "Gemini",
};

const DEFAULT_ENDPOINT_PLACEHOLDER: Record<"ollama", string> = {
  ollama: "http://localhost:11434/v1 (省略可)",
};

const DEFAULT_MODEL_PLACEHOLDER: Record<AiProviderType, string> = {
  ollama: "llama3.2 (省略可)",
  gemini: "gemini-2.0-flash (省略可)",
};

export function AiIntegrationForm({
  initialProvider,
  initialApiKey,
  initialEndpointUrl,
  initialModelName,
}: Props) {
  const [provider, setProvider] = useState<AiProviderType | "">(initialProvider ?? "");
  const [apiKey, setApiKey] = useState(initialApiKey ?? "");
  const [endpointUrl, setEndpointUrl] = useState(initialEndpointUrl ?? "");
  const [modelName, setModelName] = useState(initialModelName ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const isOllama = provider === "ollama";
  const canSave = provider !== "" && (isOllama || apiKey.trim() !== "");
  const hasSettings = initialProvider !== null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.set("ai_provider", provider);
    formData.set("ai_api_key", apiKey);
    formData.set("ai_endpoint_url", endpointUrl);
    formData.set("ai_model_name", modelName);

    const result = await updateAiSettings(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("設定を保存しました");
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!hasSettings) return;
    setIsLoading(true);

    const result = await deleteAiSettings();

    if (result?.error) {
      toast.error(result.error);
    } else {
      setProvider("");
      setApiKey("");
      setEndpointUrl("");
      setModelName("");
      toast.success("設定を削除しました");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai_provider">プロバイダー</Label>
        <Select
          value={provider}
          onValueChange={(v) => setProvider(v as AiProviderType)}
          disabled={isLoading}
        >
          <SelectTrigger id="ai_provider">
            <SelectValue placeholder="プロバイダーを選択..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PROVIDER_LABELS) as AiProviderType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PROVIDER_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {provider !== "" && !isOllama && (
        <div className="space-y-2">
          <Label htmlFor="ai_api_key">APIキー</Label>
          <Input
            id="ai_api_key"
            name="ai_api_key"
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
        </div>
      )}

      {provider !== "" && (
        <>
          {isOllama && (
            <div className="space-y-2">
              <Label htmlFor="ai_endpoint_url">
                エンドポイントURL
                <span className="ml-1 text-xs text-muted-foreground">(任意)</span>
              </Label>
              <Input
                id="ai_endpoint_url"
                name="ai_endpoint_url"
                type="url"
                placeholder={DEFAULT_ENDPOINT_PLACEHOLDER["ollama"]}
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ai_model_name">
              モデル名
              <span className="ml-1 text-xs text-muted-foreground">(任意)</span>
            </Label>
            <Input
              id="ai_model_name"
              name="ai_model_name"
              type="text"
              placeholder={DEFAULT_MODEL_PLACEHOLDER[provider as AiProviderType]}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading || !canSave}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isLoading || !hasSettings}
          onClick={handleDelete}
          title="設定を削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
