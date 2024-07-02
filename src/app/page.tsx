import Head from "next/head";
import Image from "next/image";
import Translator from "@/components/Translator"



export default function Home() {
  return (
    <div>
      <Head>
        <meta />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Web-Speech API Testing</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <Translator/> 
    </div>
    
  );
}
