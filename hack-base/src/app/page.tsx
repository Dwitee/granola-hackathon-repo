/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { Card } from "@/components/ui/Cards";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gen-search-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        configId: string;
        location?: string;
        triggerId?: string;
      };
    }
  }
}

type Health = {
  status: string;
  time: string;
  env: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => {
        setHealth({
          status: "error",
          time: new Date().toISOString(),
          env: "client",
        });
      });
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUpload = async (selected: File[]) => {
    if (!selected.length) return;
    setFiles(selected);
    setUploading(true);
    setUploadStatus(null);

    try {
      const uploadedPaths: string[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        const data = await res.json();
        if (data.path) {
          uploadedPaths.push(data.path);
        }
      }
      if (uploadedPaths.length > 0) {
        setUploadStatus("Uploaded to secure transcript store in Vertex AI bucket.");
      } else {
        setUploadStatus("Upload completed, but no paths returned from API.");
      }
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed. Please check the backend logs / configuration.");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
  
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
  
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: trimmed,
          sessionId: "web-demo-session",
          history: nextMessages,
        }),
      });
  
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Chat request failed");
      }
  
      const replyText =
        data.reply ||
        "The agent responded, but no text reply was parsed from the payload.";
  
      setMessages([
        ...nextMessages,
        { role: "assistant", content: replyText },
      ]);
    } catch (error) {
      console.error(error);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I couldn't reach the Interview Insight Agent. Please verify /api/chat and Vertex AI settings.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="space-y-3">
        <p className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-sky-300">
          <span className="text-[10px]">●</span>
          AI-native hiring intelligence for modern teams
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
          AI-Powered Interview Insight &amp; Candidate
          <span className="text-sky-400"> Scoring Studio</span>
        </h1>
        <p className="text-slate-300 max-w-3xl text-sm md:text-base">
          Upload interview transcripts between interviewers and candidates, then ask questions in natural language:
          <span className="text-slate-100"> “List all candidates”, “What were the key questions?”, “Compare them on a scale of 1–10”,</span>
          and more. Turn raw conversations into structured, defendable hiring decisions.
        </p>
      </section>

      {/* Upload Section */}
      <Card title="Upload Candidate Transcripts">
        <div
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            handleUpload(files);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-sky-500/40 hover:border-sky-400 rounded-xl p-6 text-center transition-colors cursor-pointer"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.txt,.json"
            multiple
            hidden
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              handleUpload(selected);
            }}
          />
          <p className="text-slate-300 text-sm">
            Drag &amp; drop interview transcripts here, or{" "}
            <span className="text-sky-400 underline">browse</span> to upload.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Accepted formats: PDF, TXT, JSON
          </p>
          {uploading && (
            <p className="mt-3 text-[11px] text-sky-400">
              Uploading transcripts to your secure data store...
            </p>
          )}
          {uploadStatus && !uploading && (
            <p className="mt-2 text-[11px] text-slate-400">
              {uploadStatus}
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-xs text-slate-400 mb-2">Uploaded files:</p>
            <ul className="text-sm text-slate-200 list-disc list-inside space-y-1">
              {files.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Layout: How it works + Example queries */}
      <section className="grid md:grid-cols-2 gap-6">
        <Card title="How this system will work">
          <ol className="list-decimal list-inside text-sm space-y-1 text-slate-200">
            <li>Upload one or more interview transcripts (PDF / text / JSON).</li>
            <li>We index conversations securely using an AI application hosted on Google Cloud Vertex AI.</li>
            <li>Use a chat-style interface to ask questions about candidates, questions asked, skills, and ratings.</li>
            <li>Get ranked insights, comparison scores, and explanation traces for every decision.</li>
          </ol>
        </Card>

        <Card title="Ask in natural language">
          <ul className="list-disc list-inside text-sm space-y-1 text-slate-200">
            <li>“Show me all candidates who applied for Backend Engineer.”</li>
            <li>“Summarise candidate A vs candidate B for system design skills.”</li>
            <li>“Rate each candidate from 1–10 for communication, based on the transcript.”</li>
            <li>“Highlight any red flags mentioned by the interviewers.”</li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            Next step: we&apos;ll connect this UI to the Vertex AI application endpoint to power the chat.
          </p>
        </Card>
      </section>

      {/* Chat Interface */}
      <Card title="Interview Insight Chat">
        <div className="flex flex-col gap-3">
          <div className="h-56 overflow-y-auto rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm space-y-2">
            {messages.length === 0 && (
              <p className="text-slate-500 text-xs">
                Ask about your interview transcripts. For example:
                <span className="block text-sky-400 mt-1">
                  “Who are the candidates?” • “Summarise candidate strengths.” • “Rate each candidate 1–10 for communication.”
                </span>
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  "max-w-[90%] px-3 py-2 rounded-2xl " +
                  (m.role === "user"
                    ? "ml-auto bg-sky-600/80 text-white"
                    : "mr-auto bg-slate-800 text-slate-100")
                }
              >
                <span className="block text-[10px] uppercase tracking-wide mb-0.5 opacity-70">
                  {m.role === "user" ? "You" : "Interview Insight Agent"}
                </span>
                <span className="text-xs leading-snug whitespace-pre-wrap">
                  {m.content}
                </span>
              </div>
            ))}
            {chatLoading && (
              <p className="text-[10px] text-sky-400">
                Thinking based on your transcripts...
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 text-xs md:text-sm px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 outline-none focus:border-sky-500 text-slate-100"
              placeholder="Ask anything about the interviews in natural language..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded-xl text-xs md:text-sm bg-sky-500 disabled:bg-slate-600 text-white font-medium hover:bg-sky-400 transition-colors"
            >
              {chatLoading ? "Asking..." : "Ask"}
            </button>
          </div>
        </div>
      </Card>

      {/* Vertex AI Search Widget */}
      <Card title="Ask with Vertex AI Search">
        <p className="text-sm text-slate-400 mb-3">
          This widget connects directly to your Vertex AI Interview Insights app for RAG-powered search.
        </p>
        <input
          placeholder="Search here"
          id="searchWidgetTrigger"
          className="w-full p-3 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 outline-none focus:border-sky-500"
        />
        {isClient && (
          <>
            <Script
              id="vertex-gen-app-builder"
              src="https://cloud.google.com/ai/gen-app-builder/client?hl=en_US"
              strategy="afterInteractive"
            />
            <gen-search-widget
              configId="114deb3b-87ea-424b-b868-bd9ebbee25c4"
              location="eu"
              triggerId="searchWidgetTrigger"
            ></gen-search-widget>
          </>
        )}
      </Card>

      {/* API Health Check */}
      <Card title="Backend / API Health Check">
        {health ? (
          <div className="text-sm space-y-1">
            <p>
              Status:{" "}
              <span
                className={
                  "font-mono " +
                  (health.status === "ok"
                    ? "text-emerald-400"
                    : "text-rose-400")
                }
              >
                {health.status}
              </span>
            </p>
            <p>Time: <span className="font-mono">{health.time}</span></p>
            <p>Env seen by API: <span className="font-mono">{health.env}</span></p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Checking /api/health ...</p>
        )}
      </Card>
    </div>
  );
}