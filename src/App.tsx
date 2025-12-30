import { useState, useEffect, FormEvent } from 'react';
import { Search, Volume2, BookOpen, Clock, Star, Bookmark, TrendingUp, Copy, Check, X, History } from 'lucide-react';

// --- Interfaces ---
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

function App() {
  // --- State ---
  const [value, setValue] = useState<string>('');
  const [data, setData] = useState<DictionaryEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  
  // Tabs are now primarily for Mobile view switching
  const [mobileTab, setMobileTab] = useState<'main' | 'history' | 'favorites'>('main');
  
  const [selectedMeaningIndex, setSelectedMeaningIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  const commonWords = ['ephemeral', 'serendipity', 'eloquent', 'ambiguous', 'resilient', 'pragmatic', 'ubiquitous', 'paradigm'];

  // --- Effects ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('wordHistory');
    const savedFavorites = localStorage.getItem('wordFavorites');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedAutoPlay = localStorage.getItem('autoPlayAudio');
    
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedDarkMode) setIsDarkMode(savedDarkMode === 'true');
    if (savedAutoPlay) setAutoPlayAudio(savedAutoPlay === 'true');
  }, []);

  useEffect(() => { localStorage.setItem('wordHistory', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('wordFavorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('darkMode', String(isDarkMode)); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('autoPlayAudio', String(autoPlayAudio)); }, [autoPlayAudio]);

  // --- Logic ---
  const searchWord = async (word: string) => {
    if (!word.trim()) return;
    
    setLoading(true);
    setErr(null);
    setMobileTab('main'); // Switch back to main view on search
    const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    
    try {
      const res = await fetch(`${url}${word.toLowerCase()}`);
      if (!res.ok) throw new Error('Word not found');
      
      const result: DictionaryEntry[] = await res.json();
      setData(result);
      setSelectedMeaningIndex(0);
      
      const newHistoryItem: HistoryItem = {
        word: word.toLowerCase(),
        timestamp: Date.now()
      };
      
      setHistory(prev => {
        const filtered = prev.filter(item => item.word !== word.toLowerCase());
        return [newHistoryItem, ...filtered].slice(0, 50); // Increased history limit
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

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    await searchWord(value);
  };

  const playAudio = (entryData?: DictionaryEntry[]) => {
    const dataToUse = entryData || data;
    if (!dataToUse || !dataToUse[0]) return;
    const audioSrc = dataToUse[0].phonetics.find(p => p.audio && p.audio !== "")?.audio;
    if (audioSrc) {
      new Audio(audioSrc).play().catch(e => console.log("Audio play failed", e));
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
        timestamp: Date.now()
      };
      setFavorites(prev => [newFavorite, ...prev]);
    }
  };

  const removeFromFavorites = (word: string) => {
    setFavorites(prev => prev.filter(f => f.word !== word));
  };

  const isFavorite = () => {
    if (!data || !data[0]) return false;
    return favorites.some(f => f.word === data[0].word);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getAllSynonyms = () => {
    if (!data || !data[0]) return [];
    const synonyms = new Set<string>();
    data[0].meanings.forEach(meaning => {
      meaning.synonyms?.forEach(syn => synonyms.add(syn));
      meaning.definitions.forEach(def => def.synonyms?.forEach(syn => synonyms.add(syn)));
    });
    return Array.from(synonyms);
  };

  // --- Styles ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    card: isDarkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800' : 'bg-white/80 backdrop-blur-md border-white/50',
    cardHover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-white',
    textMain: isDarkMode ? 'text-slate-50' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    accent: 'text-indigo-500',
    accentBg: isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    input: isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500',
    buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300 font-sans`}>
      {/* Navigation / Header */}
      <nav className={`sticky top-0 z-50 border-b ${theme.border} ${isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'} backdrop-blur-lg`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className={`text-2xl font-bold tracking-tight ${theme.textMain}`}>
                Dictionary<span className="text-indigo-500">Plus</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
               {/* Mobile Tabs */}
              <div className="flex lg:hidden mr-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                 <button onClick={() => setMobileTab('main')} className={`p-2 rounded ${mobileTab === 'main' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}><Search className="w-4 h-4 text-slate-500" /></button>
                 <button onClick={() => setMobileTab('history')} className={`p-2 rounded ${mobileTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}><History className="w-4 h-4 text-slate-500" /></button>
                 <button onClick={() => setMobileTab('favorites')} className={`p-2 rounded ${mobileTab === 'favorites' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}><Star className="w-4 h-4 text-slate-500" /></button>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full ${theme.cardHover} ${theme.textMuted} transition-all`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT/CENTER COLUMN: Search & Definition (Spans 8 or 9 cols on Desktop) */}
          <div className={`lg:col-span-8 xl:col-span-9 ${mobileTab !== 'main' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Search Hero */}
            <div className={`relative mb-8 ${loading ? 'opacity-80' : ''}`}>
              <form onSubmit={handle} className="relative z-20">
                <input
                  type="text"
                  placeholder="Search for a word..."
                  className={`w-full h-16 pl-14 pr-32 text-xl rounded-2xl border-2 outline-none transition-all shadow-sm ${theme.input}`}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(value.length > 0)}
                />
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 ${theme.textMuted}`} />
                <button
                  type="submit"
                  disabled={loading}
                  className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-medium transition-all ${theme.buttonPrimary} disabled:opacity-50`}
                >
                  {loading ? '...' : 'Search'}
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && value.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border shadow-xl z-30 ${theme.card} ${theme.border}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme.textMuted}`}>Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {commonWords.filter(w => w.toLowerCase().includes(value.toLowerCase())).map(word => (
                      <button
                        key={word}
                        onClick={() => { setValue(word); setShowSuggestions(false); searchWord(word); }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${theme.accentBg} ${theme.accent} hover:opacity-80`}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error State */}
            {err && (
              <div className={`p-8 rounded-2xl text-center border ${theme.border} ${theme.card}`}>
                <div className="text-4xl mb-4">🤔</div>
                <h3 className={`text-xl font-bold ${theme.textMain}`}>No Definitions Found</h3>
                <p className={`mt-2 ${theme.textMuted}`}>{err}</p>
              </div>
            )}

            {/* Initial State */}
            {!data && !loading && !err && (
              <div className={`py-20 text-center border-2 border-dashed rounded-3xl ${theme.border} opacity-50`}>
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h2 className={`text-2xl font-semibold ${theme.textMain}`}>Word Hunter</h2>
                <p className="text-slate-500 mt-2">Enter a word above to uncover its meaning</p>
              </div>
            )}

            {/* Definition Content */}
            {data && data[0] && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Card */}
                <div className={`p-6 sm:p-8 rounded-3xl border mb-6 shadow-sm ${theme.card} ${theme.border}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className={`text-5xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-purple-600 mb-2`}>
                        {data[0].word}
                      </h1>
                      {data[0].phonetic && (
                        <p className={`text-xl font-serif ${theme.textMuted}`}>{data[0].phonetic}</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => playAudio()}
                        className={`p-4 rounded-full transition-transform hover:scale-105 active:scale-95 ${theme.buttonPrimary}`}
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                      <button
                        onClick={toggleFavorite}
                        className={`p-4 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                          isFavorite() ? 'bg-yellow-400/10 border-yellow-400 text-yellow-500' : `${theme.cardHover} ${theme.border} ${theme.textMuted}`
                        }`}
                      >
                        <Star className={`w-6 h-6 ${isFavorite() ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Part of Speech Selection */}
                {data[0].meanings.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {data[0].meanings.map((meaning, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMeaningIndex(idx)}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                          selectedMeaningIndex === idx
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                            : `${theme.card} ${theme.textMuted} hover:opacity-80`
                        }`}
                      >
                        {meaning.partOfSpeech}
                      </button>
                    ))}
                  </div>
                )}

                {/* Meanings Grid */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {data[0].meanings[selectedMeaningIndex].partOfSpeech}
                    </span>
                    <div className={`h-px flex-1 ${theme.border} border-t`}></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data[0].meanings[selectedMeaningIndex].definitions.map((def, idx) => (
                      <div 
                        key={idx} 
                        className={`group relative p-6 rounded-2xl border transition-all duration-200 hover:shadow-md ${theme.card} ${theme.border} ${idx === 0 ? 'md:col-span-2 bg-linear-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className={`text-lg leading-relaxed ${theme.textMain}`}>
                            {def.definition}
                          </p>
                          <button
                            onClick={() => copyToClipboard(def.definition)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            {copiedText === def.definition ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                          </button>
                        </div>
                        
                        {def.example && (
                          <div className="mt-4 pl-4 border-l-2 border-indigo-300 dark:border-indigo-700">
                            <p className={`italic ${theme.textMuted}`}>"{def.example}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Synonyms Tag Cloud */}
                  {getAllSynonyms().length > 0 && (
                     <div className={`p-6 rounded-2xl border ${theme.card} ${theme.border}`}>
                      <h3 className={`flex items-center gap-2 font-bold mb-4 ${theme.textMain}`}>
                        <TrendingUp className="w-5 h-5 text-indigo-500" /> Synonyms
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getAllSynonyms().slice(0, 15).map(syn => (
                          <button
                            key={syn}
                            onClick={() => { setValue(syn); searchWord(syn); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border hover:border-indigo-300 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                          >
                            {syn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: History & Favorites (Desktop: Sticky, Mobile: via Tabs) */}
          <div className={`lg:col-span-4 xl:col-span-3 space-y-6 ${mobileTab === 'main' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Quick Toggle for Mobile View Specifics */}
            <div className={`lg:sticky lg:top-24 space-y-6`}>
              
              {/* Settings Card */}
              <div className={`p-5 rounded-2xl border ${theme.card} ${theme.border}`}>
                <h3 className={`font-bold mb-3 ${theme.textMain}`}>Preferences</h3>
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <span className={`text-sm ${theme.textMuted}`}>Auto-play Audio</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${autoPlayAudio ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <input type="checkbox" checked={autoPlayAudio} onChange={(e) => setAutoPlayAudio(e.target.checked)} className="opacity-0 w-full h-full absolute cursor-pointer" />
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${autoPlayAudio ? 'left-6' : 'left-1'}`} />
                  </div>
                </label>
              </div>

              {/* History Section */}
              <div className={`p-1 rounded-2xl border flex flex-col h-[400px] lg:h-[calc(50vh-100px)] ${theme.card} ${theme.border} ${(mobileTab === 'history' || mobileTab === 'main') ? 'block' : 'hidden lg:block'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className={`font-bold flex items-center gap-2 ${theme.textMain}`}>
                    <Clock className="w-4 h-4 text-indigo-500" /> Recent History
                  </h3>
                  <button onClick={() => setHistory([])} className="text-xs text-red-400 hover:text-red-500">Clear</button>
                </div>
                <div className="overflow-y-auto p-2 space-y-1 flex-1 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                      <History className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No history yet</p>
                    </div>
                  ) : (
                    history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setValue(item.word); searchWord(item.word); }}
                        className={`w-full text-left px-3 py-3 rounded-xl flex justify-between items-center group transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <span className={`font-medium ${theme.textMain}`}>{item.word}</span>
                        <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {new Date(item.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Favorites Section */}
              <div className={`p-1 rounded-2xl border flex flex-col h-[400px] lg:h-[calc(50vh-100px)] ${theme.card} ${theme.border} ${(mobileTab === 'favorites' || mobileTab === 'main') ? 'block' : 'hidden lg:block'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className={`font-bold flex items-center gap-2 ${theme.textMain}`}>
                    <Star className="w-4 h-4 text-yellow-500" /> Favorites
                  </h3>
                </div>
                <div className="overflow-y-auto p-2 space-y-2 flex-1 custom-scrollbar">
                  {favorites.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                      <Bookmark className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No favorites yet</p>
                    </div>
                  ) : (
                    favorites.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border group ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-start">
                          <button 
                            onClick={() => { setValue(item.word); searchWord(item.word); }}
                            className="font-bold hover:text-indigo-500 transition-colors"
                          >
                            {item.word}
                          </button>
                          <button onClick={() => removeFromFavorites(item.word)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${theme.textMuted}`}>{item.definition}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
}

export default App;