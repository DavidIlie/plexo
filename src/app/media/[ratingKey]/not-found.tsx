import Link from "next/link";
import { Film } from "lucide-react";

import { Button } from "~/components/ui/button";

const NotFound = () => (
   <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
         <Film className="h-5 w-5" />
      </div>
      <h1 className="text-lg font-semibold">Media not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
         This title may have moved or is no longer available in the Plex
         library.
      </p>
      <div className="mt-5 flex gap-2">
         <Button asChild variant="outline" size="sm">
            <Link href="/movies">Browse movies</Link>
         </Button>
         <Button asChild variant="outline" size="sm">
            <Link href="/tv">Browse TV</Link>
         </Button>
      </div>
   </div>
);

export default NotFound;
