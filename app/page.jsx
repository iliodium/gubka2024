import Image from "next/image";
import CubeScene from "@/components/CubeScene";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div id='container'></div>
      <CubeScene />
    </main>
  );
}
