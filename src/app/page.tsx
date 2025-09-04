import PingPongGame from "@/components/ping-pong-game";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <main>
        <PingPongGame />
      </main>
    </div>
  );
}