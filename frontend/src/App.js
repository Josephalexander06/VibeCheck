import { useState } from 'react';
import { Music, Book, Search, Star, ArrowLeft, Heart, Zap, Cloud, Sun, Smile, Scale, Download, ExternalLink } from './components/Icons';

const API_BASE = "https://vibecheck-aqd5.onrender.com";


const BOOK_APIS = {
  // Open Library API - Free, no API key required
  openLibrary: 'https://openlibrary.org',
  // Google Books API - Free, but rate limited without API key
  googleBooks: 'https://www.googleapis.com/books/v1/volumes',
  // Project Gutenberg - Free public domain books with PDFs
  gutenberg: 'https://gutendex.com/books',
  // Internet Archive - Free books with PDFs
  archive: 'https://archive.org'
};


const MoodApp = () => {
  const [currentStep, setCurrentStep] = useState('choice');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [moodResult, setMoodResult] = useState(null);
  const [moodData, setMoodData] = useState(null);
  const [musicTracks, setMusicTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mood assessment questions
  const questions = [
    {
      question: "How would you describe your energy level right now?",
      options: [
        { text: "Very low, feeling drained", value: 1 },
        { text: "Below average, a bit tired", value: 2 },
        { text: "Moderate, okay energy", value: 3 },
        { text: "Good energy, feeling active", value: 4 },
        { text: "Very high, full of energy", value: 5 }
      ]
    },
    {
      question: "What's your current stress level?",
      options: [
        { text: "Extremely stressed, overwhelmed", value: 5 },
        { text: "High stress, feeling pressured", value: 4 },
        { text: "Moderate stress, manageable", value: 3 },
        { text: "Low stress, mostly relaxed", value: 2 },
        { text: "No stress, completely calm", value: 1 }
      ]
    },
    {
      question: "How are you feeling emotionally?",
      options: [
        { text: "Very sad or down", value: 1 },
        { text: "Slightly melancholic", value: 2 },
        { text: "Neutral, neither good nor bad", value: 3 },
        { text: "Generally positive and happy", value: 4 },
        { text: "Extremely joyful and upbeat", value: 5 }
      ]
    },
    {
      question: "What do you need most right now?",
      options: [
        { text: "To calm down and relax", value: 1 },
        { text: "To feel more motivated", value: 2 },
        { text: "To process my thoughts", value: 3 },
        { text: "To maintain my good mood", value: 4 },
        { text: "To celebrate and feel energized", value: 5 }
      ]
    },
    {
      question: "How would you describe your current focus?",
      options: [
        { text: "Very scattered, can't concentrate", value: 1 },
        { text: "Somewhat distracted", value: 2 },
        { text: "Average focus, doing okay", value: 3 },
        { text: "Good focus, feeling clear", value: 4 },
        { text: "Laser-focused and sharp", value: 5 }
      ]
    }
  ];

  // Mood categories with icons
  const moodCategories = {
    'anxious': { icon: Heart, color: 'text-red-500', bg: 'bg-red-50', name: 'Anxious/Overwhelmed' },
    'stressed': { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', name: 'Stressed/Tired' },
    'melancholic': { icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-50', name: 'Melancholic/Reflective' },
    'calm': { icon: Sun, color: 'text-green-500', bg: 'bg-green-50', name: 'Calm/Peaceful' },
    'upbeat': { icon: Smile, color: 'text-yellow-500', bg: 'bg-yellow-50', name: 'Upbeat/Positive' },
    'balanced': { icon: Scale, color: 'text-purple-500', bg: 'bg-purple-50', name: 'Balanced/Neutral' }
  };



  // Real Book Search Functions
  const searchGoogleBooks = async (query, maxResults = 20) => {
    try {
      const response = await fetch(
        `${BOOK_APIS.googleBooks}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`
      );
      const data = await response.json();

      if (data.items) {
        return data.items.map(item => ({
          id: item.id,
          title: item.volumeInfo.title || 'Unknown Title',
          authors: item.volumeInfo.authors || ['Unknown Author'],
          description: item.volumeInfo.description || 'No description available.',
          thumbnail: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail,
          categories: item.volumeInfo.categories || ['General'],
          publishedDate: item.volumeInfo.publishedDate,
          pageCount: item.volumeInfo.pageCount,
          averageRating: item.volumeInfo.averageRating || 0,
          ratingsCount: item.volumeInfo.ratingsCount || 0,
          previewLink: item.volumeInfo.previewLink,
          infoLink: item.volumeInfo.infoLink,
          isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier,
          publisher: item.volumeInfo.publisher,
          language: item.volumeInfo.language || 'en',
          source: 'google'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching Google Books:', error);
      return [];
    }
  };

  const searchGutenbergBooks = async (query) => {
    try {
      const response = await fetch(
        `${BOOK_APIS.gutenberg}?search=${encodeURIComponent(query)}&mime_type=application/pdf`
      );
      const data = await response.json();

      if (data.results) {
        return data.results.slice(0, 10).map(item => ({
          id: `gutenberg-${item.id}`,
          title: item.title || 'Unknown Title',
          authors: item.authors.map(author => author.name) || ['Unknown Author'],
          description: `Free public domain book from Project Gutenberg. ${item.subjects?.slice(0, 3).join(', ') || ''}`,
          thumbnail: null,
          categories: item.subjects?.slice(0, 2) || ['Literature'],
          publishedDate: null,
          pageCount: null,
          averageRating: 4.0, // Default for classics
          ratingsCount: item.download_count || 0,
          previewLink: `https://www.gutenberg.org/ebooks/${item.id}`,
          infoLink: `https://www.gutenberg.org/ebooks/${item.id}`,
          pdfUrl: item.formats['application/pdf'] || null,
          epubUrl: item.formats['application/epub+zip'] || null,
          textUrl: item.formats['text/plain'] || null,
          downloadCount: item.download_count,
          languages: item.languages,
          source: 'gutenberg',
          isFree: true
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching Gutenberg:', error);
      return [];
    }
  };

  const searchOpenLibrary = async (query) => {
    try {
      const response = await fetch(
        `${BOOK_APIS.openLibrary}/search.json?q=${encodeURIComponent(query)}&limit=15`
      );
      const data = await response.json();

      if (data.docs) {
        return data.docs.map(item => ({
          id: `openlibrary-${item.key?.replace('/works/', '')}`,
          title: item.title || 'Unknown Title',
          authors: item.author_name || ['Unknown Author'],
          description: item.first_sentence?.join(' ') || 'Classic literature from Open Library.',
          thumbnail: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null,
          categories: item.subject?.slice(0, 3) || ['Literature'],
          publishedDate: item.first_publish_year,
          pageCount: null,
          averageRating: 3.8, // Default rating
          ratingsCount: item.edition_count || 0,
          previewLink: `${BOOK_APIS.openLibrary}${item.key}`,
          infoLink: `${BOOK_APIS.openLibrary}${item.key}`,
          isbn: item.isbn?.[0],
          publisher: item.publisher?.[0],
          language: item.language || ['en'],
          editions: item.edition_count,
          source: 'openlibrary'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching Open Library:', error);
      return [];
    }
  };

  // Combined search function
  const searchRealBooks = async (query, mood = null) => {
    setIsLoading(true);
    setError(null);

    try {
      let searchTerm = query;

      // If searching by mood, add relevant genre terms
      if (mood && moodCategories[mood]) {
        const genres = moodCategories[mood].genres;
        searchTerm = `${query} ${genres[0]}`;
      }

      // Search multiple sources in parallel
      const [googleResults, gutenbergResults, openLibraryResults] = await Promise.all([
        searchGoogleBooks(searchTerm),
        searchGutenbergBooks(searchTerm),
        searchOpenLibrary(searchTerm)
      ]);

      // Combine and deduplicate results
      const allResults = [
        ...googleResults,
        ...gutenbergResults,
        ...openLibraryResults
      ];

      // Remove duplicates based on title similarity
      const uniqueResults = [];
      const seenTitles = new Set();

      for (const book of allResults) {
        const normalizedTitle = book.title.toLowerCase().replace(/[^\w\s]/g, '');
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          uniqueResults.push(book);
        }
      }

      // Sort by rating and relevance
      uniqueResults.sort((a, b) => {
        if (a.source === 'gutenberg' && b.source !== 'gutenberg') return -1;
        if (b.source === 'gutenberg' && a.source !== 'gutenberg') return 1;
        return (b.averageRating || 0) - (a.averageRating || 0);
      });

      return uniqueResults.slice(0, 24); // Limit to 24 results

    } catch (error) {
      console.error('Error searching books:', error);
      throw new Error('Failed to search books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // API functions
  const analyzeMood = async (answers) => {
    try {
      const response = await fetch(`${API_BASE_URL}/mood/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error('Failed to analyze mood');
      return await response.json();
    } catch (error) {
      console.error('Error analyzing mood:', error);
      throw error;
    }
  };

  const getTracksByMood = async (mood) => {
    setLoading(true);
    // console.log('Set loading to true');

    try {
      // Make API call
      const response = await fetch(`${API_BASE_URL}/music/tracks/${mood}`);
      const data = await response.json();
      // console.log('API data received:', data);
      setMusicTracks(data.tracks);
      return data.tracks;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      // console.log('Set loading to false');
      // console.log('=== CLEAN TEST END ===');
    }
  };


  // const searchBooks = async (query, mood = null) => {
  //   try {
  //     let url = `${API_BASE_URL}/books/search?`;
  //     if (query) url += `q=${encodeURIComponent(query)}&`;
  //     if (mood) url += `mood=${mood}&`;

  //     const response = await fetch(url);
  //     if (!response.ok) throw new Error('Failed to search books');
  //     const data = await response.json();
  //     return data.books;
  //   } catch (error) {
  //     console.error('Error searching books:', error);
  //     throw error;
  //   }
  // };

  // Handle answer selection
  const handleAnswer = async (value) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      try {
        setIsLoading(true);
        const moodData = await analyzeMood(newAnswers);
        const tracks = await getTracksByMood(moodData.mood);
        setMoodResult(moodData.mood);
        setMoodData(moodData);
        setMusicTracks(tracks || []);
        setCurrentStep('mood-result');
      } catch (error) {
        setError('Failed to analyze mood. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle book search
  const handleBookSearch = async (query = searchQuery, moodFilter = null) => {
    if (!query.trim()) return;

    try {
      const results = await searchRealBooks(query, moodFilter);
      setSearchResults(results);
      if (currentStep !== 'book-results') {
        setCurrentStep('book-results');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Search by mood category
  const searchByMood = (mood) => {
    const moodName = moodCategories[mood].name;
    setSearchQuery(moodName);
    handleBookSearch(moodName, mood);
  };

  // Reset to initial choice
  const resetToChoice = () => {
    setCurrentStep('choice');
    setSelectedOption(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setMoodResult(null);
    setMoodData(null);
    setMusicTracks([]);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const viewBookDetails = (book) => {
    setSelectedBook(book);
    setCurrentStep('book-details');
  };

  // Get book rating display
  const getRatingDisplay = (rating, ratingsCount) => {
    const stars = Math.round(rating || 0);
    const count = ratingsCount || 0;
    return { stars, count };
  };


  // Show loading state during mood analysis
  if (isLoading && currentStep === 'mood-questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your mood...</p>
        </div>
      </div>
    );
  }

  // Render choice screen
  const renderChoice = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">MoodSync</h1>
          <p className="text-gray-600 text-lg">Find perfect content for your mood</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedOption('music');
              setCurrentStep('mood-questions');
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-8 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            <Music size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Music Recommendations</h2>
            <p className="text-purple-100">Get personalized playlists based on your current mood</p>
          </button>

          <button
            onClick={() => {
              setSelectedOption('books');
              setCurrentStep('book-search');
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-8 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            <Book size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Real Book Library</h2>
            <p className="text-emerald-100">Discover real books with free PDFs and summaries</p>
          </button>
        </div>
      </div>
    </div>
  );

  // Render mood questions
  const renderMoodQuestions = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <button
          onClick={resetToChoice}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to main menu
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{questions[currentQuestion].question}</h2>
          </div>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.value)}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


  // Render mood result with music playlists
  const renderMoodResult = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your recommendations...</p>
          </div>
        </div>
      );
    }

    if (!musicTracks || !Array.isArray(musicTracks) || musicTracks.length === 0) {
      console.log('No tracks condition met');
      return <p>No tracks available at the moment.</p>;
    }
    const validTracks = musicTracks.filter(track =>
      track && track.name && track.artist && track.albumArt && track.external_url
    );

    console.log('Valid tracks:', validTracks);

    if (validTracks.length === 0) {
      return <p>No valid tracks found.</p>;
    }

    const mood = moodCategories[moodResult];
    const MoodIcon = mood.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <button
            onClick={resetToChoice}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to main menu
          </button>

          <div className="text-center mb-12">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${mood.bg} mb-4`}>
              <MoodIcon size={40} className={mood.color} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">You're feeling {moodData.category_name}</h1>
            <p className="text-gray-600">Here are some perfect songs for your current mood</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {musicTracks.map((track, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
              >
                {/* Spotify Embed Player */}
                <iframe
                  src={`https://open.spotify.com/embed/track/${track.id}`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl"
                  title={`Spotify player for ${track.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render book search with real-time search
  const renderBookSearch = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <button
          onClick={resetToChoice}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to main menu
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Real Book Library</h1>
          <p className="text-gray-600">Search millions of real books with free PDFs and summaries</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Enhanced Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBookSearch()}
              placeholder="Search for books, authors, or topics..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={() => handleBookSearch()}
              disabled={isLoading}
              className="absolute right-3 top-3 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Try: "meditation", "adventure", "philosophy", "programming", etc.
          </p>
        </div>

        {/* Mood Categories */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Or browse by mood:</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(moodCategories).map(([key, mood]) => {
              const MoodIcon = mood.icon;
              return (
                <button
                  key={key}
                  onClick={() => searchByMood(key)}
                  disabled={isLoading}
                  className={`p-4 rounded-xl ${mood.bg} hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50`}
                >
                  <MoodIcon size={24} className={`${mood.color} mx-auto mb-2`} />
                  <span className="text-sm font-medium text-gray-700">{mood.name}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {mood.genres ? mood.genres.slice(0, 2).join(', ') : 'Various genres'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );


  // Render book results
  const renderBookResults = () => (

    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <button
          onClick={() => setCurrentStep('book-search')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to search
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Results</h1>
          <p className="text-gray-600">
            {isLoading ? 'Searching real books...' : `Found ${searchResults.length} books for "${searchQuery}"`}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Searching millions of books...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((book) => {
              const rating = getRatingDisplay(book.averageRating, book.ratingsCount);
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
                >
                  {/* Book Cover Section - Fixed Height */}
                  <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 p-4 h-48 flex items-center justify-center">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-24 h-36 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback for missing image */}
                    <div className={`w-24 h-36 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-md flex items-center justify-center ${book.thumbnail ? 'hidden' : 'flex'}`}>
                      <Book size={32} className="text-white" />
                    </div>

                    {/* Source Badge - Fixed Position */}
                    <div className="absolute top-2 right-2">
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
        book.source === 'gutenberg' ? 'bg-blue-500 text-white' :
        book.source === 'google' ? 'bg-red-500 text-white' :
        'bg-green-500 text-white'
      }`}>
        {book.source === 'gutenberg' ? 'Free PDF' :
         book.source === 'google' ? 'Google' :
         'Open Library'}
      </span>
    </div>
  </div>

                  {/* Book Details Section - Flexible Height */}
                  <div className="p-4 flex flex-col flex-grow">

                    {/* Title and Author - Fixed Space */}
                    <div className="mb-3 min-h-[60px]">
                      <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-2 leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        by {Array.isArray(book.authors)
                          ? book.authors.slice(0, 2).join(', ')
                          : book.authors || 'Unknown Author'}
                      </p>
                    </div>

                    {/* Rating - Fixed Space */}
                     <div className="flex items-center mb-3 h-5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={12} 
          className={i < Math.floor(rating.stars) ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-500">
        {rating.stars.toFixed(1)}
      </span>
      {rating.count > 0 && (
        <span className="ml-1 text-xs text-gray-500">({rating.count})</span>
      )}
    </div>
    

                    {/* Categories - Fixed Space */}
                    {/* <div className="mb-3 min-h-[24px]">
                    <div className="flex flex-wrap gap-1">
                      {book.categories && book.categories.slice(0, 2).map((category, idx) => (
                        <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                          {category.length > 12 ? category.substring(0, 12) + '...' : category}
                        </span>
                      ))}
                    </div>
                  </div> */}

                    {/* Description - Flexible Space
                  <div className="mb-3 flex-grow">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {book.description 
                        ? (book.description.length > 150 
                          ? book.description.substring(0, 150) + '...' 
                          : book.description)
                        : 'No description available.'}
                    </p>
                  </div> */}


                    {/* Meta Info - Fixed Space */}
                    {/* <div className="text-xs text-gray-500 mb-4 flex justify-between h-4">
                    <span>{book.publishedDate || 'Classic'}</span>
                    {book.pageCount && <span>{book.pageCount} pages</span>}
                  </div> */}

                    {/* Action Buttons - Fixed at Bottom */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => viewBookDetails && viewBookDetails(book)}
                        className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <span className="mr-1">👁</span>
                        Details
                      </button>

                      {book.pdfUrl && (
                        <button
                          onClick={() => window.open(book.pdfUrl, '_blank')}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          title="Download PDF"
                        >
                          📄
                        </button>
                      )}

                      <button
                        onClick={() => window.open(book.previewLink || book.infoLink, '_blank')}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                        title="View Online"
                      >
                        🔗
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results State */}
        {!isLoading && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No books found</h3>
              <p className="text-gray-500">No results for "{searchQuery}"</p>
            </div>

            <div className="max-w-md mx-auto">
              <p className="text-gray-400 text-sm mb-4">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['meditation', 'adventure', 'philosophy', 'programming', 'psychology', 'fiction', 'science', 'history'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleBookSearch(suggestion);
                    }}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200 transition-colors font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Book Details View
  const renderBookDetails = () => {
    if (!selectedBook) return null;

    const rating = getRatingDisplay(selectedBook.averageRating, selectedBook.ratingsCount);

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <button
            onClick={() => setCurrentStep('book-results')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to results
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Book Cover & Downloads */}
              <div className="text-center">
                {selectedBook.thumbnail ? (
                  <img
                    src={selectedBook.thumbnail}
                    alt={selectedBook.title}
                    className="w-48 h-64 object-cover rounded-lg mx-auto mb-6 shadow-lg"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2MCIgdmlld0JveD0iMCAwIDIwMCAyNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzEwNSAxMzAgMTEwIDEyNSAxMTAgMTIwQzExMCAxMTUgMTA1IDExMCAxMDAgMTEwQzk1IDExMCA5MCAxMTUgOTAgMTIwQzkwIDEyNSA5NSAxMzAgMTAwIDEzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                ) : (
                  <div className="w-48 h-64 bg-gray-200 rounded-lg mx-auto mb-6 flex items-center justify-center">
                    <Book size={48} className="text-gray-400" />
                  </div>
                )}

                {/* Download Buttons */}
                <div className="space-y-3">
                  {selectedBook.pdfUrl && (
                    <button
                      onClick={() => window.open(selectedBook.pdfUrl, '_blank')}
                      className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Download size={18} className="mr-2" />
                      Download PDF
                    </button>
                  )}

                  {selectedBook.epubUrl && (
                    <button
                      onClick={() => window.open(selectedBook.epubUrl, '_blank')}
                      className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                    >
                      <Download size={18} className="mr-2" />
                      Download EPUB
                    </button>
                  )}

                  <button
                    onClick={() => window.open(selectedBook.previewLink || selectedBook.infoLink, '_blank')}
                    className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    View Online
                  </button>
                </div>

                {/* Source Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Source:</strong> {
                      selectedBook.source === 'gutenberg' ? 'Project Gutenberg' :
                        selectedBook.source === 'google' ? 'Google Books' :
                          'Open Library'
                    }
                  </p>
                  {selectedBook.isFree && (
                    <p className="text-sm text-green-600 font-medium">✓ Free Public Domain</p>
                  )}
                </div>
              </div>

              {/* Book Details */}
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedBook.title}</h1>
                  <p className="text-xl text-gray-600 mb-4">
                    by {Array.isArray(selectedBook.authors) ? selectedBook.authors.join(', ') : selectedBook.authors}
                  </p>

                  {/* Rating & Stats */}
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={i < rating.stars ? 'text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600">{rating.stars.toFixed(1)}</span>
                      {rating.count > 0 && <span className="ml-1 text-gray-500">({rating.count})</span>}
                    </div>

                    {selectedBook.downloadCount && (
                      <div className="text-gray-600">
                        <strong>{selectedBook.downloadCount.toLocaleString()}</strong> downloads
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedBook.categories.map((category, idx) => (
                      <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedBook.description || 'No description available for this book.'}
                  </p>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedBook.publishedDate && (
                    <div>
                      <span className="font-medium text-gray-800">Published:</span>
                      <span className="ml-2 text-gray-600">{selectedBook.publishedDate}</span>
                    </div>
                  )}

                  {selectedBook.publisher && (
                    <div>
                      <span className="font-medium text-gray-800">Publisher:</span>
                      <span className="ml-2 text-gray-600">{selectedBook.publisher}</span>
                    </div>
                  )}

                  {selectedBook.pageCount && (
                    <div>
                      <span className="font-medium text-gray-800">Pages:</span>
                      <span className="ml-2 text-gray-600">{selectedBook.pageCount}</span>
                    </div>
                  )}

                  {selectedBook.isbn && (
                    <div>
                      <span className="font-medium text-gray-800">ISBN:</span>
                      <span className="ml-2 text-gray-600">{selectedBook.isbn}</span>
                    </div>
                  )}

                  {selectedBook.language && (
                    <div>
                      <span className="font-medium text-gray-800">Language:</span>
                      <span className="ml-2 text-gray-600">
                        {Array.isArray(selectedBook.language) ? selectedBook.language.join(', ') : selectedBook.language}
                      </span>
                    </div>
                  )}

                  {selectedBook.editions && (
                    <div>
                      <span className="font-medium text-gray-800">Editions:</span>
                      <span className="ml-2 text-gray-600">{selectedBook.editions}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Main render logic
  switch (currentStep) {
    case 'choice':
      return renderChoice();
    case 'mood-questions':
      return renderMoodQuestions();
    case 'mood-result':
      return renderMoodResult();
    case 'book-search':
      return renderBookSearch();
    case 'book-results':
      return renderBookResults();
    case 'book-details':
      return renderBookDetails();
    default:
      return renderChoice();
  }
};
export default MoodApp;