"use client";

import { useRef, useState } from "react";
import { updateAiSettings, deleteAiSettings, fetchGeminiModels } from "../actions";
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
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Check, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { AiProviderType } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  initialProvider: AiProviderType | null;
  initialApiKey: string | null;
  initialEndpointUrl: string | null;
  initialModelName: string | null;
};

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  gemini: "Gemini",
  openrouter: "OpenRouter",
};

const DEFAULT_MODEL: Record<AiProviderType, string> = {
  gemini: "gemini-2.0-flash",
  openrouter: "openai/gpt-4o-mini",
};

export function AiIntegrationForm({ initialProvider, initialApiKey, initialModelName }: Props) {
  const [provider, setProvider] = useState<AiProviderType | "">(initialProvider ?? "");
  const [apiKey, setApiKey] = useState(initialApiKey ?? "");
  const [modelName, setModelName] = useState(initialModelName ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const canSave = provider !== "" && apiKey.trim() !== "";
  const hasSettings = initialProvider !== null;
  const canFetchModels = provider === "gemini" && apiKey.trim() !== "";

  const filteredModels = fetchedModels.filter((m) =>
    m.toLowerCase().includes(modelName.toLowerCase())
  );

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.set("ai_provider", provider);
    formData.set("ai_api_key", apiKey);
    formData.set("ai_endpoint_url", "");
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
      setModelName("");
      setFetchedModels([]);
      toast.success("設定を削除しました");
    }
    setIsLoading(false);
  };

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const result = await fetchGeminiModels(apiKey);

      if (result.error) {
        toast.error(result.error);
      } else {
        const models = result.models ?? [];
        setFetchedModels(models);
        if (models.length === 0) {
          toast.info("利用可能なモデルが見つかりませんでした");
        } else {
          toast.success(`${models.length}件のモデルを取得しました`);
          setModelDropdownOpen(true);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "モデルの取得に失敗しました");
      setFetchedModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai_provider">プロバイダー</Label>
        <Select
          value={provider}
          onValueChange={(v) => {
            const p = v as AiProviderType;
            setProvider(p);
            setModelName(DEFAULT_MODEL[p]);
            setFetchedModels([]);
            setModelDropdownOpen(false);
          }}
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

      {provider !== "" && (
        <div className="space-y-2">
          <Label htmlFor="ai_api_key">APIキー</Label>
          <Input
            id="ai_api_key"
            name="ai_api_key"
            type="text"
            placeholder={provider === "gemini" ? "AIzaSy..." : "sk-or-..."}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setFetchedModels([]);
            }}
            disabled={isLoading}
            autoComplete="off"
          />
        </div>
      )}

      {provider !== "" && (
        <div className="space-y-2">
          <Label htmlFor="ai_model_name">
            モデル名
            <span className="ml-1 text-xs text-muted-foreground">(任意)</span>
          </Label>
          <div className="flex gap-2">
            <Popover
              open={modelDropdownOpen && filteredModels.length > 0}
              onOpenChange={setModelDropdownOpen}
            >
              <PopoverAnchor asChild>
                <Input
                  ref={modelInputRef}
                  id="ai_model_name"
                  name="ai_model_name"
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  onFocus={() => {
                    if (fetchedModels.length > 0) setModelDropdownOpen(true);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                  autoComplete="off"
                />
              </PopoverAnchor>
              <PopoverContent
                className="w-(--radix-popover-anchor-width) p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command>
                  <CommandList>
                    <CommandEmpty>一致するモデルがありません</CommandEmpty>
                    <CommandGroup>
                      {filteredModels.map((m) => (
                        <CommandItem
                          key={m}
                          value={m}
                          onSelect={() => {
                            setModelName(m);
                            setModelDropdownOpen(false);
                            modelInputRef.current?.focus();
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              modelName === m ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {m}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {provider === "gemini" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLoading || isFetchingModels || !canFetchModels}
                onClick={handleFetchModels}
                tooltip="モデル一覧を取得"
              >
                <RefreshCw className={cn("h-4 w-4", isFetchingModels && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading || !canSave}>
          {isLoading ? <LoaderCircle className="animate-spin" /> : "保存"}
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
