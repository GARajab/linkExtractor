import React, { useState } from 'react';
import { Download, Loader2, AlertCircle, Trash2 } from 'lucide-react';

export default function BulkLinkExtractor() {
    const [inputUrls, setInputUrls] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');

    const TARGET_HOSTS = ['mediafire', 'akia', 'viki', '1file', 'rootz'];

    const extractGameName = (url) => {
        try {
            const path = new URL(url).pathname;
            const segments = path.split('/').filter(Boolean);
            const gameName = segments[segments.length - 1] || segments[segments.length - 2] || 'Unknown';
            return gameName.replace(/-/g, ' ').replace(/\//g, '').trim();
        } catch {
            return 'Unknown Game';
        }
    };

    const extractLinks = (html) => {
        const hrefRegex = /href=["']([^"']+)["']/gi;
        const links = [];
        let match;

        while ((match = hrefRegex.exec(html)) !== null) {
            links.push(match[1]);
        }

        return links;
    };

    const filterFileHostLinks = (links) => {
        return links.filter(url =>
            TARGET_HOSTS.some(host => url.toLowerCase().includes(host))
        );
    };

    const fetchUrl = async (url) => {
        const response = await fetch(url);
        return await response.text();
    };

    const processUrls = async () => {
        const urls = inputUrls.split('\n').filter(u => u.trim());

        if (urls.length === 0) {
            setOutput('Please enter at least one URL');
            return;
        }

        setLoading(true);
        setOutput('');
        let results = [];

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i].trim();
            setProgress(`Processing ${i + 1}/${urls.length}: ${url}`);

            try {
                const html = await fetchUrl(url);
                const allLinks = extractLinks(html);
                const fileHostLinks = filterFileHostLinks(allLinks);

                const gameName = extractGameName(url);

                if (fileHostLinks.length > 0) {
                    results.push(`\n${'='.repeat(60)}`);
                    results.push(`GAME: ${gameName}`);
                    results.push(`SOURCE: ${url}`);
                    results.push(`FOUND: ${fileHostLinks.length} links`);
                    results.push(`${'='.repeat(60)}\n`);

                    fileHostLinks.forEach(link => results.push(link));
                } else {
                    results.push(`\n[No file hosting links found for: ${gameName}]\n`);
                }
            } catch (error) {
                results.push(`\n[ERROR fetching ${url}: ${error.message}]\n`);
            }
        }

        setOutput(results.join('\n'));
        setProgress('');
        setLoading(false);
    };

    const downloadResults = () => {
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted-links.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-white/20">
                    <h1 className="text-4xl font-bold text-white mb-2">Bulk Link Extractor</h1>
                    <p className="text-purple-200 mb-6">Extract file hosting links from multiple game pages</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Input Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-white font-semibold">Input URLs (one per line)</label>
                                <button
                                    onClick={() => setInputUrls('')}
                                    className="text-red-300 hover:text-red-100 text-sm flex items-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    Clear
                                </button>
                            </div>
                            <textarea
                                value={inputUrls}
                                onChange={(e) => setInputUrls(e.target.value)}
                                placeholder="https://example.com/game1&#10;https://example.com/game2&#10;https://example.com/game3"
                                className="w-full h-96 p-4 bg-slate-800/50 text-white border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                            />

                            <button
                                onClick={processUrls}
                                disabled={loading}
                                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Extracting...
                                    </>
                                ) : (
                                    'Extract All Links'
                                )}
                            </button>

                            {progress && (
                                <div className="mt-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                                    <p className="text-blue-200 text-sm">{progress}</p>
                                </div>
                            )}
                        </div>

                        {/* Output Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-white font-semibold">Results</label>
                                {output && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={copyToClipboard}
                                            className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm"
                                        >
                                            Copy
                                        </button>
                                        <button
                                            onClick={downloadResults}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={output}
                                readOnly
                                placeholder="Results will appear here..."
                                className="w-full h-96 p-4 bg-slate-800/50 text-green-300 border border-purple-500/30 rounded-lg font-mono text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-yellow-300 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-yellow-200">
                                <p className="font-semibold mb-1">Filters for: Mediafire, Akia, Viki, 1File, Rootz</p>
                                <p>Note: Some websites may block requests due to CORS. If a URL fails, try using the Node.js version or browser console method.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}