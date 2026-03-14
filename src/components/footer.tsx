import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
   return (
      <footer className="mt-16 border-t border-border/50">
         <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <Image
                  src="/icon.svg"
                  alt="Plexo"
                  width={16}
                  height={16}
                  className="rounded opacity-50"
               />
               <span>plexo</span>
               <span className="text-border">·</span>
               <span>{new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
               <span>
                  by{" "}
                  <Link
                     href="https://davidilie.com"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                     David Ilie
                  </Link>
               </span>
               <span className="text-border">·</span>
               <Link
                  href="https://github.com/davidilie/plexo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:text-foreground hover:underline"
               >
                  GitHub
               </Link>
            </div>
         </div>
      </footer>
   );
};
