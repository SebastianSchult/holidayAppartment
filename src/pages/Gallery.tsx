import { useEffect, useState } from 'react';
import { ASSET_BASE, imgUrl } from '../lib/assets';

export default function Gallery() {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${ASSET_BASE}/gallery/index.json`)
      .then(r => r.json())
      .then((arr: string[]) => setFiles(arr))
      .catch(() => setFiles([]));
  }, []);

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">Galerie</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {files.map((name) => (
          <img
            key={name}
            src={imgUrl(`gallery/${name}`)}
            alt=""
            className="aspect-video w-full rounded-xl object-cover"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
    </section>
  );
}