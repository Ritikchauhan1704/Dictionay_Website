import { useState, useEffect } from "react";
import {
  Search,
  Volume2,
  BookOpen,
  Clock,
  Star,
  Bookmark,
  TrendingUp,
  Copy,
  Check,
  History,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Phonetic {
  text?: string;
  audio?: string;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  sourceUrls: string[];
}

interface HistoryItem {
  word: string;
  timestamp: number;
}

interface FavoriteItem {
  word: string;
  definition: string;
  timestamp: number;
}

export default function App() {
  const [value, setValue] = useState<string>("");
  const [data, setData] = useState<DictionaryEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [mobileTab, setMobileTab] = useState<"main" | "history" | "favorites">(
    "main"
  );
  const [selectedMeaningIndex, setSelectedMeaningIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("isDarkMode") === "true";
    const prefersD = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || prefersD;
    setIsDarkMode(initial);

    const saved_history = localStorage.getItem("history");
    const saved_favorites = localStorage.getItem("favorites");

    if (saved_history) setHistory(JSON.parse(saved_history));
    if (saved_favorites) setFavorites(JSON.parse(saved_favorites));
  }, []);

  useEffect(() => {
    localStorage.setItem("isDarkMode", isDarkMode.toString());
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const searchWord = async (word: string) => {
    if (!word.trim()) return;

    setLoading(true);
    setErr(null);
    setMobileTab("main");

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          word.toLowerCase()
        )}`
      );

      if (!res.ok) throw new Error("Word not found");
      const result: DictionaryEntry[] = await res.json();
      setData(result);
      setSelectedMeaningIndex(0);

      const newHistoryItem: HistoryItem = {
        word: word.toLowerCase(),
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.word !== word.toLowerCase()
        );
        return [newHistoryItem, ...filtered].slice(0, 50);
      });

      if (autoPlayAudio) {
        setTimeout(() => playAudio(result), 300);
      }
    } catch (error) {
      console.error(error);
      setData(null);
      setErr(`"${word}" not found in dictionary`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchWord(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const playAudio = (entryData?: DictionaryEntry[]) => {
    const dataToUse = entryData || data;
    if (!dataToUse || !dataToUse[0]) return;
    const audioSrc = dataToUse[0].phonetics.find(
      (p) => p.audio && p.audio !== ""
    )?.audio;
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.crossOrigin = "anonymous";
      audio.play().catch((e) => console.log("Audio play failed", e));
    }
  };

  const toggleFavorite = () => {
    if (!data || !data[0]) return;
    if (isFavorite()) {
      removeFromFavorites(data[0].word);
    } else {
      const newFavorite: FavoriteItem = {
        word: data[0].word,
        definition: data[0].meanings[0].definitions[0].definition,
        timestamp: Date.now(),
      };
      setFavorites((prev) => [newFavorite, ...prev]);
    }
  };

  const removeFromFavorites = (word: string) => {
    setFavorites((prev) => prev.filter((f) => f.word !== word));
  };

  const isFavorite = () => {
    if (!data || !data[0]) return false;
    return favorites.some((f) => f.word === data[0].word);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getAllSynonyms = () => {
    if (!data || !data[0]) return [];
    const synonyms = new Set<string>();
    data[0].meanings.forEach((meaning) => {
      meaning.synonyms?.forEach((syn) => synonyms.add(syn));
      meaning.definitions.forEach((def) =>
        def.synonyms?.forEach((syn) => synonyms.add(syn))
      );
    });
    return Array.from(synonyms);
  };

  const theme = {
    bg: isDarkMode
      ? "bg-slate-950"
      : "bg-gradient-to-br from-slate-50 to-blue-50",
    textMain: isDarkMode ? "text-slate-100" : "text-slate-900",
    textMuted: isDarkMode ? "text-slate-400" : "text-slate-600",
    border: isDarkMode ? "border-slate-700" : "border-slate-200",
    card: isDarkMode ? "bg-slate-900" : "bg-white",
    cardBorder: isDarkMode ? "border-slate-800" : "border-slate-200",
  };

  return (
    <div
      className={`min-h-screen ${
        theme.bg
      } transition-colors duration-300 font-sans ${isDarkMode ? "dark" : ""}`}
    >
      {/* Navigation / Header */}
      <nav
        className={`sticky top-0 z-50 border-b ${theme.border} ${
          isDarkMode ? "bg-slate-950/95" : "bg-white/95"
        } backdrop-blur-lg`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-indigo-600 to-blue-600 p-2 rounded-lg shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-xl sm:text-2xl font-bold tracking-tight ${theme.textMain}`}
              >
                Dictionary
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Tabs
                value={mobileTab}
                onValueChange={(v) => setMobileTab(v as any)}
                className="lg:hidden"
              >
                <TabsList
                  className={`${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}
                >
                  <TabsTrigger value="main">
                    <Search className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="favorites">
                    <Star className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={() => setIsDarkMode(!isDarkMode)}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT/CENTER COLUMN: Search & Definition */}
          <div
            className={`lg:col-span-8 xl:col-span-9 ${
              mobileTab !== "main" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Search Hero */}
            <div className={`relative mb-8 ${loading ? "opacity-80" : ""}`}>
              <div className="relative z-20">
                <div className="relative">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                  />
                  <Input
                    type="text"
                    placeholder="Search for a word..."
                    className={`w-full h-14 pl-12 pr-28 text-base ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700 text-slate-100"
                        : "bg-white border-slate-200"
                    }`}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                    }}
                    onKeyDown={handleKeyPress}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? "..." : "Search"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {err && (
              <Card
                className={`${
                  isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white"
                }`}
              >
                <CardContent className="p-8 text-center">
                  <div className="text-5xl mb-4">🤔</div>
                  <h3 className={`text-xl font-bold ${theme.textMain}`}>
                    No Definitions Found
                  </h3>
                  <p className={`mt-2 ${theme.textMuted}`}>{err}</p>
                </CardContent>
              </Card>
            )}

            {/* Initial State */}
            {!data && !loading && !err && (
              <div
                className={`py-20 text-center border-2 border-dashed rounded-3xl ${theme.border} opacity-50`}
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h2 className={`text-2xl font-semibold ${theme.textMain}`}>
                  Word Hunter
                </h2>
                <p className={theme.textMuted}>
                  Enter a word above to uncover its meaning
                </p>
              </div>
            )}

            {/* Definition Content */}
            {data && data[0] && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                {/* Header Card */}
                <Card
                  className={`${
                    isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white"
                  }`}
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
                          {data[0].word}
                        </h1>
                        {data[0].phonetic && (
                          <p
                            className={`text-lg font-serif ${theme.textMuted}`}
                          >
                            {data[0].phonetic}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => playAudio()}
                          size="icon"
                          className="rounded-full w-14 h-14 bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Volume2 className="w-6 h-6" />
                        </Button>
                        <Button
                          onClick={toggleFavorite}
                          size="icon"
                          className={`rounded-full w-14 h-14 ${
                            isFavorite()
                              ? "bg-amber-400 hover:bg-amber-500 text-slate-900"
                              : isDarkMode
                              ? "bg-slate-800 hover:bg-slate-700"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              isFavorite() ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Part of Speech Selection */}
                {data[0].meanings.length > 1 && (
                  <Tabs
                    value={String(selectedMeaningIndex)}
                    onValueChange={(v) => setSelectedMeaningIndex(Number(v))}
                    className="mb-6"
                  >
                    <TabsList
                      className={isDarkMode ? "bg-slate-800" : "bg-slate-100"}
                    >
                      {data[0].meanings.map((meaning, idx) => (
                        <TabsTrigger key={idx} value={String(idx)}>
                          {meaning.partOfSpeech}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}

                {/* Meanings Grid */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge
                      variant="outline"
                      className={`${
                        isDarkMode
                          ? "bg-slate-800 text-slate-200 border-slate-700"
                          : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      {data[0].meanings[selectedMeaningIndex].partOfSpeech}
                    </Badge>
                    <div className={`h-px flex-1 ${theme.border}`}></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data[0].meanings[selectedMeaningIndex].definitions.map(
                      (def, idx) => (
                        <Card
                          key={idx}
                          className={`group transition-all duration-200 hover:shadow-md ${
                            isDarkMode
                              ? "bg-slate-900 border-slate-700 hover:bg-slate-800"
                              : "bg-white"
                          } ${idx === 0 ? "md:col-span-2" : ""}`}
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                              <p
                                className={`text-lg leading-relaxed ${theme.textMain}`}
                              >
                                {def.definition}
                              </p>
                              <Button
                                onClick={() => copyToClipboard(def.definition)}
                                variant="ghost"
                                size="icon"
                                className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isDarkMode
                                    ? "hover:bg-slate-800"
                                    : "hover:bg-slate-100"
                                }`}
                              >
                                {copiedText === def.definition ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>

                            {def.example && (
                              <div
                                className={`mt-4 pl-4 border-l-2 ${
                                  isDarkMode
                                    ? "border-indigo-600"
                                    : "border-indigo-300"
                                }`}
                              >
                                <p className={`italic ${theme.textMuted}`}>
                                  "{def.example}"
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>

                  {/* Synonyms Tag Cloud */}
                  {getAllSynonyms().length > 0 && (
                    <Card
                      className={`${
                        isDarkMode
                          ? "bg-slate-900 border-slate-700"
                          : "bg-white"
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />{" "}
                          Synonyms
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {getAllSynonyms()
                            .slice(0, 15)
                            .map((syn) => (
                              <Badge
                                key={syn}
                                variant="outline"
                                className={`cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? "border-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
                                    : "hover:bg-indigo-50 border-slate-200"
                                }`}
                                onClick={() => {
                                  setValue(syn);
                                  searchWord(syn);
                                }}
                              >
                                {syn}
                              </Badge>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: History & Favorites */}
          <div
            className={`lg:col-span-4 xl:col-span-3 space-y-6 ${
              mobileTab === "main" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Settings Card */}
              <Card
                className={`${
                  isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-base">Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <label
                    className={`flex items-center justify-between cursor-pointer ${theme.textMain}`}
                  >
                    <span className={`text-sm ${theme.textMuted}`}>
                      Auto-play Audio
                    </span>
                    <Switch
                      checked={autoPlayAudio}
                      onCheckedChange={setAutoPlayAudio}
                    />
                  </label>
                </CardContent>
              </Card>

              {/* History Section */}
              <Card
                className={`flex flex-col h-[400px] lg:h-[calc(50vh-100px)] ${
                  mobileTab === "history" || mobileTab === "main"
                    ? "flex"
                    : "hidden lg:flex"
                } ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white"}`}
              >
                <CardHeader className="flex-row justify-between items-center space-y-0 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" /> Recent History
                  </CardTitle>
                  <Button
                    onClick={() => setHistory([])}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-500 h-auto p-1"
                  >
                    Clear
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-4">
                    {history.length === 0 ? (
                      <div
                        className={`text-center py-10 opacity-50 ${theme.textMuted}`}
                      >
                        <History className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1 pb-4">
                        {history.map((item, idx) => (
                          <Button
                            key={idx}
                            onClick={() => {
                              setValue(item.word);
                              searchWord(item.word);
                              setMobileTab("main");
                            }}
                            variant="ghost"
                            className={`w-full justify-between ${
                              isDarkMode
                                ? "hover:bg-slate-800"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-medium text-left">
                              {item.word}
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {new Date(item.timestamp).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Favorites Section */}
              <Card
                className={`flex flex-col h-[400px] lg:h-[calc(50vh-100px)] ${
                  mobileTab === "favorites" || mobileTab === "main"
                    ? "flex"
                    : "hidden lg:flex"
                } ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white"}`}
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Favorites
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-4">
                    {favorites.length === 0 ? (
                      <div
                        className={`text-center py-10 opacity-50 ${theme.textMuted}`}
                      >
                        <Bookmark className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No favorites yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pb-4">
                        {favorites.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg group ${
                              isDarkMode
                                ? "bg-slate-800 hover:bg-slate-700"
                                : "bg-slate-50 hover:bg-slate-100"
                            } transition-colors`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Button
                                  onClick={() => {
                                    setValue(item.word);
                                    searchWord(item.word);
                                    setMobileTab("main");
                                  }}
                                  variant="ghost"
                                  className="h-auto p-0 font-semibold text-left text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {item.word}
                                </Button>
                                <p
                                  className={`text-xs mt-1 line-clamp-2 ${theme.textMuted}`}
                                >
                                  {item.definition}
                                </p>
                              </div>
                              <Button
                                onClick={() => removeFromFavorites(item.word)}
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
