import Image from "next/image";
import dynamic from 'next/dynamic'
import { ReelFetcher } from "@/components/ReelFetcher";

const LocationForm = dynamic(() => import('../components/LocationForm').then((mod) => mod.LocationForm), { ssr: false })


export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-4xl">
      

        <div className="w-full mt-8">
          <h2 className="text-2xl font-bold mb-4">Add New Location</h2>
          <LocationForm />
        </div>
        <div className="w-full mt-8">
          <h2 className="text-2xl font-bold mb-4">Add Videos to a location</h2>
        <ReelFetcher/>
        </div>
      </main>

     
    </div>
  );
}