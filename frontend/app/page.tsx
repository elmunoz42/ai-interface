'use client';
import Image from "next/image";
import ChatApp from "./aichat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <ChatApp></ChatApp>
    </main>
  );
}
